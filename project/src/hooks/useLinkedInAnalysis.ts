import { useState } from 'react';
import { ProfileAnalysis } from '../types';
import { linkedInApi } from '../services/linkedinApi';
import { aiAnalysisService } from '../services/aiAnalysisService';
import type { LinkedInProfileFields } from '../components/ProfileFieldEditor';

export const useLinkedInAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<(keyof LinkedInProfileFields)[]>([]);
  const [initialProfileFields, setInitialProfileFields] = useState<Partial<LinkedInProfileFields>>({});

  // Helpers to normalize AI output for accuracy and consistency
  const clamp = (n: any, min: number, max: number) => {
    const x = Number(n);
    if (Number.isNaN(x)) return 0;
    return Math.max(min, Math.min(max, x));
  };
  const normalizeSection = (s: any = {}) => ({
    score: clamp(s.score, 0, 100),
    strengths: Array.isArray(s.strengths) ? s.strengths : [],
    improvements: Array.isArray(s.improvements) ? s.improvements : [],
  });
  const computeCompleteness = (p: any) => {
    const fields: (keyof LinkedInProfileFields)[] = ['summary', 'experience', 'skills', 'education'];
    const total = fields.length;
    const filled = fields.reduce((acc, k) => acc + (p?.[k] && String(p[k]).trim() ? 1 : 0), 0);
    return Math.round((filled / total) * 100);
  };
  const buildNormalizedAnalysis = (aiResult: any, profileUrl: string, profileData: any): ProfileAnalysis => {
    const summary = normalizeSection(aiResult?.summary);
    const experience = normalizeSection(aiResult?.experience);
    const skills = normalizeSection(aiResult?.skills);
    const education = normalizeSection(aiResult?.education);
    const sectionScores = [summary.score, experience.score, skills.score, education.score];
    const avgScore = sectionScores.reduce((a, b) => a + b, 0) / (sectionScores.length || 1);
    let overallScore = clamp(aiResult?.overallScore, 0, 100);
    if (!overallScore) overallScore = Math.round(avgScore);

    const completeness = clamp(aiResult?.completeness ?? computeCompleteness(profileData), 0, 100);
    const engagement = clamp(aiResult?.engagement ?? Math.round((skills.score + experience.score) / 2), 0, 100);
    const visibility = clamp(aiResult?.visibility ?? Math.round((summary.score + skills.score) / 2), 0, 100);

    return {
      id: Date.now().toString(),
      profileUrl,
      score: overallScore, // mirror for components that use 'score'
      strengths: Array.isArray(aiResult?.strengths) ? aiResult.strengths : [],
      improvements: Array.isArray(aiResult?.improvements) ? aiResult.improvements : [],
      keywords: Array.isArray(aiResult?.keywords) ? aiResult.keywords : [],
      industry: aiResult?.industry || '',
      completeness,
      engagement,
      visibility,
      timestamp: new Date(),
      fullName: profileData.fullName,
      name: profileData.fullName,
      picture: profileData.picture,
      // Attach section objects with content for UI
      summary: { ...summary, content: profileData.summary || '' } as any,
      experience: { ...experience, content: profileData.experience || '' } as any,
      skills: { ...skills, content: profileData.skills || '' } as any,
      education: { ...education, content: profileData.education || '' } as any,
      // Provide overallScore separately for components that reference it
      overallScore,
    } as any;
  };

  const analyzeProfile = async (profileUrl: string) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setMissingFields([]);
    setInitialProfileFields({});

    try {
      // Try to fetch real LinkedIn profile data if access token is present
      let profileData = null;
      let user: any = {};
      let accessToken = null;
      try {
        user = JSON.parse(localStorage.getItem('linklens_user') || '{}');
        accessToken = user?.linkedinAccessToken;
        profileData = await getProfileData(profileUrl);
        if (profileData && profileData.error === 'LINKEDIN_AUTH_REQUIRED') {
          // If token is required and not present, fallback to mock/minimal analysis
          profileData = null;
        }
      } catch (e) {
        console.warn('Could not fetch real LinkedIn profile data, falling back to URL-only analysis.');
        profileData = null;
      }

      // If no profileData, fallback to minimal mock data using the URL
      if (!profileData) {
        // Use mock/minimal data for public profile analysis
        profileData = { profileUrl };
      }

      // Detect missing fields
      const requiredFields: (keyof LinkedInProfileFields)[] = ['summary', 'experience', 'skills', 'education'];
      const missing: (keyof LinkedInProfileFields)[] = [];
      const initial: Partial<LinkedInProfileFields> = {};
      for (const field of requiredFields) {
        if (!profileData?.[field] || (typeof profileData[field] === 'string' && !profileData[field].trim())) {
          missing.push(field);
        } else {
          initial[field] = profileData[field];
        }
      }
      setMissingFields(missing);
      setInitialProfileFields(initial);

      // If any required fields are missing, do not proceed to AI analysis yet
      if (missing.length > 0) {
        setIsAnalyzing(false);
        return;
      }

      let aiResult: Partial<ProfileAnalysis> = {};
      if (profileData) {
        // 2. Format and send real or minimal profile data to backend AI analysis
        aiResult = await aiAnalysisService.generateAnalysis(profileData);
      } else {
        throw new Error('Failed to fetch your LinkedIn profile data. Please try again.');
      }

      // Normalize AI result into consistent structure and scores
      const normalized = buildNormalizedAnalysis(aiResult, profileUrl, profileData);
      setAnalysis(normalized);
      console.log('✅ AI analysis completed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      console.error('❌ Analysis error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // New: Accept manual fields and re-run analysis
  const analyzeWithManualFields = async (profileUrl: string, manualFields: LinkedInProfileFields) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setMissingFields([]);
    setInitialProfileFields(manualFields);
    try {
      // Merge manualFields with fetched profileData (if any)
      let profileData = await getProfileData(profileUrl);
      profileData = { ...profileData, ...manualFields };
      let aiResult: Partial<ProfileAnalysis> = await aiAnalysisService.generateAnalysis(profileData);

      const normalized = buildNormalizedAnalysis(aiResult, profileUrl, profileData);
      setAnalysis(normalized);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setAnalysis(null);
    setError(null);
    setIsAnalyzing(false);
    setMissingFields([]);
    setInitialProfileFields({});
  };

  return {
    isAnalyzing,
    analysis,
    error,
    analyzeProfile,
    analyzeWithManualFields,
    resetAnalysis,
    missingFields,
    initialProfileFields,
  };
};

// Add a real implementation for getProfileData
async function getProfileData(profileUrl: string): Promise<any> {
  // 1. Get the user's LinkedIn access token (from localStorage or user session)
  const user: any = JSON.parse(localStorage.getItem('linklens_user') || '{}');
  const accessToken = user?.linkedinAccessToken;
  if (accessToken) {
    // 2. Fetch profile data from your backend
    const res = await fetch('http://localhost:3001/api/linkedin/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    });
    if (res.status === 401) {
      // Only remove the LinkedIn token, not the whole user object
      const user = JSON.parse(localStorage.getItem('linklens_user') || '{}');
      delete user.linkedinAccessToken;
      localStorage.setItem('linklens_user', JSON.stringify(user));
      window.dispatchEvent(new Event('linklens-auth-changed'));
      return { error: 'LINKEDIN_AUTH_REQUIRED' };
    }
    if (!res.ok) {
      console.error('Failed to fetch LinkedIn profile data:', await res.text());
      return null;
    }
    const rawProfile = await res.json();
    if (rawProfile.code === 'REVOKED_ACCESS_TOKEN') {
      const user = JSON.parse(localStorage.getItem('linklens_user') || '{}');
      delete user.linkedinAccessToken;
      localStorage.setItem('linklens_user', JSON.stringify(user));
      window.dispatchEvent(new Event('linklens-auth-changed'));
      return { error: 'LINKEDIN_AUTH_REQUIRED' };
    }
    return formatLinkedInProfile(rawProfile);
  } else {
    // No access token: fallback to minimal data (public profile analysis)
    return { profileUrl };
  }
}

// Helper to format LinkedIn profile data for AI
function formatLinkedInProfile(raw: any) {
  return {
    fullName: raw.fullName ||
      ((raw.localizedFirstName && raw.localizedLastName)
        ? `${raw.localizedFirstName} ${raw.localizedLastName}`
        : raw.localizedFirstName || raw.localizedLastName || raw.name || ''),
    firstName: raw.given_name || raw.localizedFirstName || '',
    lastName: raw.family_name || raw.localizedLastName || '',
    email: raw.email || '',
    emailVerified: raw.email_verified || false,
    picture: raw.picture || '',
    locale: raw.locale || '',
    // Add more fields as needed for your permissions
  };
}