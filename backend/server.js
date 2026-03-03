const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const multer = require('multer');
const upload = multer();
const nodemailer = require('nodemailer');
const { jsonrepair } = require('jsonrepair');
const cheerio = require('cheerio');

// In-memory OTP store (for production, use Redis or DB)
const otpStore = {}; // { email: { otp, expiresAt } }

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Remove OpenAI import and usage
// const { OpenAI } = require('openai');
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/linklens');

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
});
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  name: String,
  password: String, // hashed
  picture: String,
  googleId: String,
});

const reviewSchema = new mongoose.Schema({
  name: String,
  text: String,
  avatar: String,
  rating: Number,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Review = mongoose.model('Review', reviewSchema);
// Interview session schema (lightweight)
const interviewSessionSchema = new mongoose.Schema({
  userEmail: String,
  targetRole: String,
  questions: [
    {
      id: String,
      type: String,
      text: String,
      competency: String,
      difficulty: String,
    },
  ],
  answers: [
    {
      questionId: String,
      answer: String,
      score: Number,
      feedback: [String],
      tips: [String],
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});
const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);

const app = express();
app.use(cors()); // In production, use: cors({ origin: 'https://your-frontend-domain.com' })
app.use(express.json());

const OPENROUTER_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY (or DEEPSEEK_API_KEY) is missing in .env');
  process.exit(1);
}

async function callOpenRouterWithRetry(prompt, model = 'deepseek/deepseek-chat', maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'LinkLens',
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
          }),
          signal: controller.signal,
        }
      );
      const data = await response.json();
      if (response.ok && data.choices?.[0]?.message?.content) {
        return data;
      }
      throw new Error(data.error?.message || 'OpenRouter API error');
    } catch (e) {
      if (attempt === maxRetries) throw e;
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
    } finally {
      clearTimeout(timeout);
    }
  }
}

// AI Assistant endpoint
app.post('/api/ai-assistant', async (req, res) => {
  const { prompt, history, profileData } = req.body;
  if (!profileData && (!prompt || typeof prompt !== 'string' || !prompt.trim())) {
    return res.status(400).json({ response: 'Prompt or profile data is required.' });
  }
  console.log('Received AI assistant request:', { prompt, history });

  try {
    // DeepSeek API call
    let deepseekPrompt;
    if (profileData) {
      deepseekPrompt = `Analyze the following LinkedIn profile data. You MUST return a valid JSON object with the exact structure below.
Profile Data: ${JSON.stringify(profileData)}

Required JSON Structure:
{
  "overallScore": number (0-100),
  "summary": { "score": number, "strengths": string[], "improvements": string[], "content": string },
  "experience": { "score": number, "strengths": string[], "improvements": string[], "content": string },
  "skills": { "score": number, "strengths": string[], "improvements": string[], "content": string },
  "education": { "score": number, "strengths": string[], "improvements": string[], "content": string },
  "engagement": number (0-100),
  "completenessChecklist": {
    "summary": boolean,
    "experience": boolean,
    "skills": boolean,
    "education": boolean,
    "photo": boolean,
    "headline": boolean
  },
  "keywords": string[],
  "missingKeywords": string[],
  "industry": string,
  "industryAverages": {
    "summary": number,
    "experience": number,
    "skills": number,
    "education": number,
    "overall": number
  },
  "percentile": number (e.g., 5 for top 5%),
  "recentActivity": {
    "postsPerMonth": number,
    "industryAvgPosts": number
  }
}

Rules:
- Strengths and improvements should be concise but specific.
- "content" fields should contain a clean, formatted version of that section.
- If data is missing, provide realistic scores and empty arrays/strings as needed.
- Return ONLY the JSON object. No markdown, no triple backticks.
`;
    } else {
      deepseekPrompt = req.body.prompt;
    }

    // Use retry logic for OpenRouter API
    const data = await callOpenRouterWithRetry(deepseekPrompt);
    console.log('OpenRouter API response (raw):', JSON.stringify(data, null, 2));

    const aiMessage = data.choices[0].message.content;
    let analysis;
    if (profileData) {
      try {
        let jsonString = aiMessage;
        const jsonMatch = aiMessage.match(/\{[\s\S]*\}/);
        if (jsonMatch) jsonString = jsonMatch[0];
        try {
          analysis = JSON.parse(jsonString);
        } catch (e) {
          analysis = JSON.parse(jsonrepair(jsonString));
        }

        // Normalization and Defaults
        const clamp = (n, def = 0) => {
          const x = Number(n);
          return (Number.isFinite(x)) ? Math.max(0, Math.min(100, Math.round(x))) : def;
        };
        const normalizeSection = (s = {}) => ({
          score: clamp(s.score),
          strengths: Array.isArray(s.strengths) ? s.strengths : [],
          improvements: Array.isArray(s.improvements) ? s.improvements : [],
          content: String(s.content || '')
        });

        const normalized = {
          overallScore: clamp(analysis?.overallScore, 70),
          summary: normalizeSection(analysis?.summary),
          experience: normalizeSection(analysis?.experience),
          skills: normalizeSection(analysis?.skills),
          education: normalizeSection(analysis?.education),
          engagement: clamp(analysis?.engagement, 65),
          completenessChecklist: {
            summary: !!analysis?.completenessChecklist?.summary,
            experience: !!analysis?.completenessChecklist?.experience,
            skills: !!analysis?.completenessChecklist?.skills,
            education: !!analysis?.completenessChecklist?.education,
            photo: !!analysis?.completenessChecklist?.photo,
            headline: !!analysis?.completenessChecklist?.headline,
          },
          keywords: Array.isArray(analysis?.keywords) ? analysis.keywords.map(String) : [],
          missingKeywords: Array.isArray(analysis?.missingKeywords) ? analysis.missingKeywords.map(String) : [],
          industry: String(analysis?.industry || 'General'),
          industryAverages: {
            summary: clamp(analysis?.industryAverages?.summary, 70),
            experience: clamp(analysis?.industryAverages?.experience, 72),
            skills: clamp(analysis?.industryAverages?.skills, 75),
            education: clamp(analysis?.industryAverages?.education, 80),
            overall: clamp(analysis?.industryAverages?.overall, 74),
          },
          percentile: clamp(analysis?.percentile, 15),
          recentActivity: {
            postsPerMonth: Number(analysis?.recentActivity?.postsPerMonth) || 0,
            industryAvgPosts: Number(analysis?.recentActivity?.industryAvgPosts) || 2
          },
          timestamp: new Date().toISOString()
        };

        if (analysis?.error) {
          normalized.error = analysis.error;
        }

        return res.json({ response: normalized });
      } catch (e) {
        console.error('AI response parse error:', e, aiMessage);
        return res.status(500).json({ response: 'Failed to process AI analysis result.' });
      }
    } else {
      res.json({ response: aiMessage });
    }
  } catch (err) {
    console.error('AI assistant server error:', err);
    const msg = String(err && err.message ? err.message : err);
    if (/overloaded|unavailable|RESOURCE_EXHAUSTED|UNAVAILABLE|rate/i.test(msg)) {
      return res.status(503).json({ response: 'AI service temporarily unavailable. Please try again shortly.' });
    }
    res.status(500).json({ response: 'AI assistant error: ' + msg });
  }
});

// LinkedIn OAuth callback: exchange code for access token
app.post('/api/auth/linkedin/callback', async (req, res) => {
  const { code } = req.body;
  const redirectUri = 'http://localhost:5173/auth/linkedin/callback';
  const clientId = process.env.LINKEDIN_CLIENT_ID || '86ydkd7j66gk59';
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

  try {
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('LinkedIn token exchange error:', tokenData);
      return res.status(400).json({ error: tokenData.error_description || 'Invalid request', details: tokenData });
    }
    res.json(tokenData); // { access_token: ... }
  } catch (err) {
    console.error('LinkedIn OAuth error:', err);
    res.status(500).json({ error: 'Failed to exchange code for access token.' });
  }
});

// Email Registration
app.post('/api/auth/register', async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const hash = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ email, name, password: hash });
    res.json({ user: { email: user.email, name: user.name, picture: user.picture } });
  } catch (e) {
    res.status(400).json({ error: 'User already exists' });
  }
});

// Email Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'User not found' });
  console.log('[DEBUG] user.password:', user.password, 'type:', typeof user.password);
  if (!user.password || typeof user.password !== 'string') {
    return res.status(400).json({ error: 'This account does not have a password. Please sign in with Google.' });
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: 'Invalid password' });
  res.json({ user: { email: user.email, name: user.name, picture: user.picture } });
});

// Google Login
app.post('/api/auth/google', async (req, res) => {
  const { email, name, picture, googleId } = req.body;
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ email, name, picture, googleId });
  }
  res.json({ user: { email: user.email, name: user.name, picture: user.picture } });
});

// Post review
app.post('/api/reviews', async (req, res) => {
  const { name, text, avatar, rating } = req.body;
  const review = await Review.create({ name, text, avatar, rating });
  res.json(review);
});

// Get reviews
app.get('/api/reviews', async (req, res) => {
  const reviews = await Review.find().sort({ createdAt: -1 }).limit(20);
  res.json(reviews);
});

// Fetch signed-in user's LinkedIn profile data
app.post('/api/linkedin/profile', async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ error: 'Missing access token' });

  try {
    // Fetch profile using OpenID Connect userinfo endpoint
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const profile = await profileRes.json();
    res.json(profile);
  } catch (err) {
    console.error('LinkedIn profile fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch LinkedIn profile' });
  }
});

// Resume parsing endpoint (AI-powered)
app.post('/api/resume/parse', upload.single('resume'), async (req, res) => {
  let text = '';
  if (req.file) {
    if (req.file.mimetype === 'application/pdf') {
      const data = await pdfParse(req.file.buffer);
      text = data.text;
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value;
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }
  } else if (req.body.text) {
    text = req.body.text;
  } else {
    return res.status(400).json({ error: 'No resume provided' });
  }

  // Debug: Log the first 500 characters of extracted text
  console.log('Extracted resume text (first 500 chars):', text.slice(0, 500));

  // If the text is very short, it's likely a parsing failure
  if (!text || text.length < 200) {
    return res.status(400).json({ error: 'Failed to extract sufficient text from resume. Please check your file.' });
  }

  // Improved Gemini prompt
  const prompt = `
Extract the following sections from this resume text: Summary, Experience, Skills, Education.
- Section headers may vary (e.g., “Professional Experience” = “Experience”, “Work History” = “Experience”, “Technical Skills” = “Skills”).
- For each section, include ALL content (including bullet points, multiline, and sub-sections) until the next section header or the end of the document.
- If a section is missing or not found, return an empty string for that field.
- Return ONLY a valid JSON object with these fields, no markdown, no explanation, no extra text, no code block, no triple backticks.

Resume:
${text}

Respond in JSON:
{
  "summary": string,
  "experience": string,
  "skills": string,
  "education": string
}
`;

  let sections = {};
  try {
    const data = await callOpenRouterWithRetry(prompt);
    const aiResponse = data.choices[0].message.content;
    let clean = aiResponse.replace(/```json|```/g, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      sections = JSON.parse(jsonMatch[0]);
    } else {
      sections = JSON.parse(clean);
    }
  } catch (e) {
    // Improved fallback: line-based extraction for robustness
    const sectionLabels = {
      summary: ['summary', 'professional summary', 'profile'],
      experience: ['experience', 'professional experience', 'work history', 'employment history'],
      skills: ['skills', 'technical skills', 'core skills'],
      education: ['education', 'academic background', 'qualifications'],
    };
    const allLabels = Object.entries(sectionLabels).flatMap(([key, arr]) => arr.map(l => ({ key, label: l })));
    // Split text into lines for easier processing
    const lines = text.split(/\r?\n/);
    let currentSection = null;
    let buffer = { summary: [], experience: [], skills: [], education: [] };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Check if this line is a section header
      const found = allLabels.find(({ label }) => {
        // Match case-insensitive, allow trailing colon, and require the label to be the whole line
        return line.replace(/:$/, '').toLowerCase() === label.toLowerCase();
      });
      if (found) {
        currentSection = found.key;
        continue;
      }
      // If we're in a section, add lines to the buffer
      if (currentSection && line !== '') {
        buffer[currentSection].push(line);
      }
    }
    sections = {
      summary: buffer.summary.join(' ').trim(),
      experience: buffer.experience.join(' ').trim(),
      skills: buffer.skills.join(' ').trim(),
      education: buffer.education.join(' ').trim(),
    };
    // Debug: Log the extracted sections from fallback
    console.log('Fallback extracted sections:', sections);
  }

  // Ensure all required sections are present (set to empty string if missing)
  const requiredSections = ['summary', 'experience', 'skills', 'education'];
  for (const s of requiredSections) {
    if (!sections[s] || typeof sections[s] !== 'string') sections[s] = '';
    sections[s] = sections[s].trim();
  }

  // If ALL sections are empty, return an error
  if (requiredSections.every(s => !sections[s])) {
    return res.status(400).json({ error: 'Failed to extract any sections from your resume. Please check your file formatting or try a different file.' });
  }

  res.json({ sections });
});

// Enhance section endpoint (Gemini-powered)
app.post('/api/resume/enhance-section', async (req, res) => {
  const { section, text } = req.body;
  if (!section || !text) {
    return res.status(400).json({ error: 'Section and text are required.' });
  }
  const prompt = `
You are an expert resume writer and career coach. Enhance the following resume ${section} section to be more impactful, concise, and ATS-friendly. Return ONLY the improved text, no explanation, no markdown, no extra text.

Original ${section} section:
${text}

Enhanced:
`;
  try {
    const data = await callOpenRouterWithRetry(prompt);
    const aiResponse = data.choices[0].message.content;
    // Remove any markdown/code block
    const enhancedText = aiResponse.replace(/```[a-z]*|```/g, '').trim();
    res.json({ enhancedText });
  } catch (err) {
    res.status(500).json({ error: 'Failed to enhance section with AI.' });
  }
});

// ATS scoring endpoint (Gemini-powered)
app.post('/api/resume/ats-score', async (req, res) => {
  const { sections, jobDescription, companyUrl } = req.body;
  if (!sections || typeof sections !== 'object') {
    return res.status(400).json({ error: 'Missing or invalid resume sections. Please upload and parse your resume first.' });
  }
  const resumeText = [
    sections.summary,
    sections.experience,
    sections.skills,
    sections.education
  ].filter(Boolean).join('\n\n');

  let companyInfoText = '';
  // Check if companyUrl is a valid, absolute URL before trying to scrape
  if (companyUrl && (companyUrl.startsWith('http://') || companyUrl.startsWith('https://'))) {
    try {
      const response = await fetch(companyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        companyInfoText = $('body').text().replace(/\s\s+/g, ' ').trim().slice(0, 5000);
      }
    } catch (error) {
      console.error('Scraping error:', error);
      // Fail silently if scraping doesn't work
    }
  }

  const prompt = `
You are an expert ATS and career coach. Given the following resume, job description, and optional company info, do the following:
1. Score the resume's match to the job (0-100).
2. List matched and missing keywords/skills.
3. For each section (summary, experience, skills, education), give specific feedback. If a section is empty, say 'No content provided'.
4. Predict interview likelihood (Low/Medium/High) and explain why.
5. Suggest 3 improvements.
6. **Company Vibe Check**: If company info is provided, analyze it for core values/keywords and suggest how to align the resume.
7. **Industry Benchmark**: Briefly describe a strong candidate profile for this role and compare the user's resume against it.

IMPORTANT:
- Return ONLY a valid JSON object, with NO explanation, NO markdown, NO code block, NO extra text, NO comments, NO preamble, NO triple backticks.
- The response MUST start with '{' and end with '}'.
- If you cannot answer, return a JSON object with an "error" field explaining why.

Resume:
${resumeText}

Job Description:
${jobDescription}

${companyInfoText ? `Company Information from ${companyUrl}:
${companyInfoText}` : ''}

Respond ONLY with JSON:
{
  "score": "number",
  "likelihood": "Low|Medium|High",
  "likelihood_explanation": "string",
  "matched_keywords": ["string"],
  "missing_keywords": ["string"],
  "feedback": {
    "summary": "string",
    "experience": "string",
    "skills": "string",
    "education": "string"
  },
  "improvements": ["string"],
  "company_vibe": {
    "keywords": ["string"],
    "analysis": "string",
    "suggestions": ["string"]
  },
  "industry_benchmark": {
    "summary": "string",
    "strengths_vs_benchmark": ["string"],
    "gaps_vs_benchmark": ["string"]
  }
}
`;

  try {
    const data = await callOpenRouterWithRetry(prompt);
    const response = data.choices[0].message.content;
    let json = {};
    let jsonString = '';
    try {
      // Remove code block markers first
      let clean = response.replace(/```json|```/g, '').trim();
      // Try to extract the largest JSON object
      const jsonMatches = [...clean.matchAll(/\{[\s\S]*?\}/g)];
      if (jsonMatches.length > 0) {
        // Use the largest match (most likely the full object)
        jsonString = jsonMatches.reduce((a, b) => (a[0].length > b[0].length ? a : b))[0];
      } else {
        jsonString = clean;
      }
      // Attempt to repair common issues
      jsonString = jsonString
        .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
        .replace(/\\n/g, ' ') // Remove escaped newlines
        .replace(/([,{])\s*([a-zA-Z0-9_]+)\s*:/g, '$1 "$2":') // Ensure keys are quoted
        .replace(/\\\"/g, '"') // Unescape double quotes
        .replace(/\n/g, ' ') // Remove newlines
        .trim();
      try {
        json = JSON.parse(jsonString);
      } catch (e) {
        // Try to repair and parse
        try {
          json = JSON.parse(jsonrepair(jsonString));
        } catch (repairErr) {
          console.error('OpenRouter ATS JSON parse error:', response);
          console.error('Attempted JSON string:', jsonString);
          // Final fallback: return a JSON object with an error field and the raw response
          return res.json({
            error: 'AI did not return valid JSON. Please try a different resume, a shorter job description, or try again later.',
            rawAIResponse: response
          });
        }
      }
    } catch (e) {
      console.error('OpenRouter ATS JSON parse error:', response);
      console.error('Attempted JSON string:', jsonString);
      // Final fallback: return a JSON object with an error field and the raw response
      return res.json({
        error: 'AI did not return valid JSON. Please try a different resume, a shorter job description, or try again later.',
        rawAIResponse: response
      });
    }
    // Normalize ATS response to ensure frontend can display reliably
    const clamp = (n) => {
      const x = Number(n);
      if (!Number.isFinite(x)) return 0;
      return Math.max(0, Math.min(100, Math.round(x)));
    };
    const normalized = { ...json };
    normalized.score = clamp(normalized.score);
    const lk = (normalized.likelihood || '').toString().toLowerCase();
    if (!['low', 'medium', 'high'].includes(lk)) {
      normalized.likelihood = normalized.score >= 75 ? 'High' : normalized.score >= 50 ? 'Medium' : 'Low';
    } else {
      normalized.likelihood = lk.charAt(0).toUpperCase() + lk.slice(1);
    }
    normalized.matched_keywords = Array.isArray(normalized.matched_keywords) ? normalized.matched_keywords.map(String) : [];
    normalized.missing_keywords = Array.isArray(normalized.missing_keywords) ? normalized.missing_keywords.map(String) : [];
    normalized.improvements = Array.isArray(normalized.improvements) ? normalized.improvements.map(String) : [];
    normalized.feedback = normalized.feedback && typeof normalized.feedback === 'object' ? normalized.feedback : {};
    for (const key of ['summary', 'experience', 'skills', 'education']) {
      if (!normalized.feedback[key]) normalized.feedback[key] = '';
    }
    if (!normalized.company_vibe || typeof normalized.company_vibe !== 'object') {
      normalized.company_vibe = { keywords: [], analysis: '', suggestions: [] };
    } else {
      normalized.company_vibe.keywords = Array.isArray(normalized.company_vibe.keywords) ? normalized.company_vibe.keywords.map(String) : [];
      normalized.company_vibe.analysis = String(normalized.company_vibe.analysis || '');
      normalized.company_vibe.suggestions = Array.isArray(normalized.company_vibe.suggestions) ? normalized.company_vibe.suggestions.map(String) : [];
    }
    if (!normalized.industry_benchmark || typeof normalized.industry_benchmark !== 'object') {
      normalized.industry_benchmark = { summary: '', strengths_vs_benchmark: [], gaps_vs_benchmark: [] };
    } else {
      normalized.industry_benchmark.summary = String(normalized.industry_benchmark.summary || '');
      normalized.industry_benchmark.strengths_vs_benchmark = Array.isArray(normalized.industry_benchmark.strengths_vs_benchmark) ? normalized.industry_benchmark.strengths_vs_benchmark.map(String) : [];
      normalized.industry_benchmark.gaps_vs_benchmark = Array.isArray(normalized.industry_benchmark.gaps_vs_benchmark) ? normalized.industry_benchmark.gaps_vs_benchmark.map(String) : [];
    }
    return res.json(normalized);
  } catch (err) {
    console.error('OpenRouter ATS error:', err);
    return res.status(500).json({ error: 'AI analysis failed.' });
  }
});

// Send OTP endpoint
app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore[email] = { otp, expiresAt };

  // Send email
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your LinkLens Signup OTP',
      text: `Your OTP is: ${otp}. It is valid for 10 minutes.`,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send OTP email.' });
  }
});

// Verify OTP endpoint
app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

  const record = otpStore[email];
  if (!record) return res.status(400).json({ error: 'No OTP sent to this email' });
  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    return res.status(400).json({ error: 'OTP expired' });
  }
  if (record.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

  // OTP is valid
  delete otpStore[email]; // Remove after successful verification
  res.json({ success: true });
});

// --- Interview Prep Endpoints ---
// Generate interview questions based on resume/linkedin and target role
app.post('/api/interview/generate-questions', async (req, res) => {
  const { profile, resumeSections, targetRole, numQuestions = 10 } = req.body || {};
  const effectiveNum = Math.max(5, Math.min(20, Number(numQuestions) || 10));
  try {
    const prompt = `You are an expert technical interviewer with 15+ years of experience hiring for ${targetRole || 'software engineering'} roles. Generate ${effectiveNum} highly targeted mock interview questions based on the candidate's specific background.

CANDIDATE BACKGROUND:
${JSON.stringify({ profile, resumeSections, targetRole })}

REQUIREMENTS:
1. Questions must be SPECIFIC to the candidate's experience level, skills, and target role
2. Include industry-standard questions that are commonly asked for ${targetRole || 'this position'}
3. Balance: 40% technical, 35% behavioral, 25% situational
4. Difficulty should match the candidate's experience level
5. Each question must test a specific competency relevant to ${targetRole || 'the role'}

QUESTION TYPES:
- TECHNICAL: Code problems, system design, architecture, debugging scenarios
- BEHAVIORAL: Leadership, teamwork, conflict resolution, project management
- SITUATIONAL: Real-world scenarios, crisis management, decision making

Return ONLY valid JSON with this exact schema:
{
  "questions": [
    {
      "id": "q1",
      "type": "technical|behavioral|situational",
      "text": "Specific question text...",
      "competency": "Specific skill being tested (e.g., React, leadership, problem-solving)",
      "difficulty": "easy|medium|hard",
      "expectedKeywords": ["key", "terms", "concepts"],
      "industryContext": "Relevant industry context"
    }
  ]
}`;

    const openrouterData = await callOpenRouterWithRetry(prompt);
    const response = openrouterData.choices?.[0]?.message?.content || '{}';
    let json = {};
    try {
      let clean = response.replace(/```json|```/g, '').trim();
      const match = clean.match(/\{[\s\S]*\}/);
      json = JSON.parse(match ? match[0] : clean);
    } catch (e) {
      return res.status(400).json({ error: 'Failed to parse questions JSON.' });
    }
    const questions = Array.isArray(json.questions) ? json.questions : [];
    const normalized = questions
      .filter(q => q && q.text)
      .slice(0, effectiveNum)
      .map((q, idx) => ({
        id: String(q.id || `q${idx + 1}`),
        type: String(q.type || 'technical'),
        text: String(q.text),
        competency: String(q.competency || ''),
        difficulty: String(q.difficulty || 'medium'),
        expectedKeywords: Array.isArray(q.expectedKeywords) ? q.expectedKeywords.map(String) : [],
        industryContext: String(q.industryContext || ''),
      }));
    if (normalized.length === 0) {
      return res.status(400).json({ error: 'No questions generated. Try again.' });
    }
    res.json({ questions: normalized });
  } catch (err) {
    console.error('Generate questions error:', err);
    res.status(500).json({ error: 'Failed to generate questions.' });
  }
});

// Validate answer quality before scoring
app.post('/api/interview/validate-answer', async (req, res) => {
  const { question, answer, context } = req.body || {};
  if (!question || !answer) return res.status(400).json({ error: 'Question and answer are required.' });

  try {
    const prompt = `You are an expert interviewer. Analyze the quality and completeness of this candidate's answer before scoring.

QUESTION: ${question.text}
QUESTION TYPE: ${question.type}
COMPETENCY: ${question.competency || ''}
DIFFICULTY: ${question.difficulty || ''}

CANDIDATE ANSWER: ${answer}

ANALYZE:
1. Answer Length: Is the answer sufficiently detailed?
2. Relevance: Does it directly address the question?
3. Completeness: Are all aspects of the question covered?
4. Structure: Is the answer well-organized?
5. Specificity: Are concrete examples provided?

Return ONLY valid JSON:
{
  "isValid": true/false,
  "qualityScore": 0-100,
  "issues": ["Issue 1", "Issue 2"],
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "recommendedLength": "Short|Medium|Long",
  "missingElements": ["Element 1", "Element 2"]
}`;

    const data = await callOpenRouterWithRetry(prompt);
    const response = data.choices[0].message.content;
    let json = {};
    try {
      let clean = response.replace(/```json|```/g, '').trim();
      const match = clean.match(/\{[\s\S]*\}/);
      json = JSON.parse(match ? match[0] : clean);
    } catch (e) {
      return res.status(400).json({ error: 'Failed to parse validation JSON.' });
    }

    res.json({
      isValid: Boolean(json.isValid),
      qualityScore: Number.isFinite(Number(json.qualityScore)) ? Math.max(0, Math.min(100, Math.round(Number(json.qualityScore)))) : 0,
      issues: Array.isArray(json.issues) ? json.issues.map(String) : [],
      suggestions: Array.isArray(json.suggestions) ? json.suggestions.map(String) : [],
      recommendedLength: String(json.recommendedLength || 'Medium'),
      missingElements: Array.isArray(json.missingElements) ? json.missingElements.map(String) : [],
    });
  } catch (err) {
    console.error('Answer validation error:', err);
    res.status(500).json({ error: 'Failed to validate answer.' });
  }
});

// Score/evaluate a single answer with enhanced accuracy
app.post('/api/interview/score-answer', async (req, res) => {
  const { question, answer, context } = req.body || {};
  if (!question || !answer) return res.status(400).json({ error: 'Question and answer are required.' });
  try {
    const prompt = `You are a senior technical interviewer with 20+ years of experience evaluating candidates for ${context?.targetRole || 'software engineering'} positions. Provide a rigorous, fair, and detailed assessment of this candidate's answer.

EVALUATION CONTEXT:
Question: ${question.text}
Question Type: ${question.type}
Competency Tested: ${question.competency || ''}
Difficulty Level: ${question.difficulty || ''}
Target Role: ${context?.targetRole || 'Software Engineer'}
Industry: ${context?.industry || 'Technology'}

CANDIDATE ANSWER:
${answer}

CANDIDATE BACKGROUND:
${JSON.stringify(context || {})}

EVALUATION CRITERIA (Score 0-100):
1. TECHNICAL ACCURACY (25 points): Correctness of technical concepts, code quality, solution approach
2. COMMUNICATION CLARITY (20 points): How well the answer is articulated, structured, and explained
3. RELEVANCE & COMPLETENESS (20 points): How well the answer addresses the question and provides sufficient detail
4. PROBLEM-SOLVING APPROACH (20 points): Logical thinking, methodology, and problem-solving skills
5. INDUSTRY AWARENESS (15 points): Understanding of best practices, current trends, and real-world application

SCORING RUBRIC:
- 90-100: Exceptional - Expert level, comprehensive, innovative
- 80-89: Excellent - Strong technical skills, clear communication
- 70-79: Good - Solid understanding, minor areas for improvement
- 60-69: Satisfactory - Basic understanding, needs improvement
- Below 60: Needs work - Significant gaps in knowledge or communication

Respond ONLY with JSON using this exact schema:
{
  "score": 0,
  "feedback": ["Specific feedback point 1", "Specific feedback point 2", "Specific feedback point 3"],
  "tips": ["Actionable improvement tip 1", "Actionable improvement tip 2", "Actionable improvement tip 3"],
  "keyCompetencies": ["Competency 1", "Competency 2"],
  "strengths": ["Strength 1", "Strength 2"],
  "areasForImprovement": ["Area 1", "Area 2"],
  "technicalAccuracy": "Detailed technical assessment",
  "communicationScore": "Communication quality assessment"
}`;
    const data = await callOpenRouterWithRetry(prompt);
    const response = data.choices[0].message.content;
    let json = {};
    try {
      let clean = response.replace(/```json|```/g, '').trim();
      const match = clean.match(/\{[\s\S]*\}/);
      json = JSON.parse(match ? match[0] : clean);
    } catch (e) {
      return res.status(400).json({ error: 'Failed to parse scoring JSON.' });
    }

    // Enhanced validation and scoring
    const score = Number.isFinite(Number(json.score)) ? Math.max(0, Math.min(100, Math.round(Number(json.score)))) : 0;
    const feedback = Array.isArray(json.feedback) ? json.feedback.map(String) : [];
    const tips = Array.isArray(json.tips) ? json.tips.map(String) : [];
    const keyCompetencies = Array.isArray(json.keyCompetencies) ? json.keyCompetencies.map(String) : [];
    const strengths = Array.isArray(json.strengths) ? json.strengths.map(String) : [];
    const areasForImprovement = Array.isArray(json.areasForImprovement) ? json.areasForImprovement.map(String) : [];
    const technicalAccuracy = String(json.technicalAccuracy || '');
    const communicationScore = String(json.communicationScore || '');

    res.json({
      score,
      feedback,
      tips,
      keyCompetencies,
      strengths,
      areasForImprovement,
      technicalAccuracy,
      communicationScore
    });
  } catch (err) {
    console.error('Score answer error:', err);
    res.status(500).json({ error: 'Failed to score answer.' });
  }
});

// Save interview session
app.post('/api/interview/save', async (req, res) => {
  try {
    const { userEmail, targetRole, questions, answers } = req.body || {};
    if (!userEmail || !questions || !answers) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const doc = await InterviewSession.create({ userEmail, targetRole, questions, answers });
    res.json({ id: doc._id });
  } catch (err) {
    console.error('Save session error:', err);
    res.status(500).json({ error: 'Failed to save session.' });
  }
});

// Get history for a user
app.get('/api/interview/history', async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: 'email required' });
    const sessions = await InterviewSession.find({ userEmail: email }).sort({ createdAt: -1 }).limit(10);
    res.json({ sessions });
  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

// Get industry-specific question templates
app.get('/api/interview/industry-templates/:industry', async (req, res) => {
  const { industry } = req.params;
  const { role, level } = req.query;

  try {
    const prompt = `You are an expert interviewer specializing in ${industry} industry. Provide 5-10 industry-specific interview questions for ${role || 'software engineering'} roles at ${level || 'mid-level'} experience.

INDUSTRY: ${industry}
ROLE: ${role || 'Software Engineer'}
EXPERIENCE LEVEL: ${level || 'Mid-level (3-7 years)'}

Generate questions that test:
1. Industry-specific knowledge and trends
2. Domain expertise relevant to ${industry}
3. Real-world scenarios common in ${industry}
4. Technical skills specific to ${industry} challenges
5. Business understanding and industry context

Return ONLY valid JSON with this schema:
{
  "industry": "${industry}",
  "role": "${role || 'Software Engineer'}",
  "level": "${level || 'Mid-level'}",
  "questions": [
    {
      "id": "i1",
      "type": "technical|behavioral|situational",
      "text": "Industry-specific question...",
      "competency": "Specific competency",
      "difficulty": "easy|medium|hard",
      "industryContext": "Why this matters in ${industry}",
      "expectedKeywords": ["industry", "specific", "terms"]
    }
  ]
}`;

    const data = await callOpenRouterWithRetry(prompt);
    const response = data.choices[0].message.content;
    let json = {};
    try {
      let clean = response.replace(/```json|```/g, '').trim();
      const match = clean.match(/\{[\s\S]*\}/);
      json = JSON.parse(match ? match[0] : clean);
    } catch (e) {
      return res.status(400).json({ error: 'Failed to parse industry templates JSON.' });
    }

    res.json(json);
  } catch (err) {
    console.error('Industry templates error:', err);
    res.status(500).json({ error: 'Failed to generate industry templates.' });
  }
});

// Remove duplicate generate-questions endpoint below if any

app.listen(3001, () => console.log('Backend running on http://localhost:3001'));
