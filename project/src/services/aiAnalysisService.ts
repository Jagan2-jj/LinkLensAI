import { ProfileAnalysis } from '../types';

// Gemini AI Analysis Service for processing LinkedIn profiles via backend
export class AIAnalysisService {
  // Generate AI-powered profile analysis by calling the backend Gemini endpoint
  async generateAnalysis(profileData: Record<string, unknown>): Promise<Partial<ProfileAnalysis>> {
    try {
      const prompt = `Analyze the following LinkedIn profile data. For each section (Summary, Experience, Skills, Education), provide:\n- A score (0-100)\n- 2-3 strengths\n- 2-3 improvements\nAlso provide:\n- An overall score (0-100)\n- Recommended keywords\n- Industry\nReturn ONLY a JSON object with this structure:\n{\n  "overallScore": 92,\n  "summary": { "score": 90, "strengths": [...], "improvements": [...] },\n  "experience": { "score": 85, "strengths": [...], "improvements": [...] },\n  "skills": { "score": 88, "strengths": [...], "improvements": [...] },\n  "education": { "score": 80, "strengths": [...], "improvements": [...] },\n  "keywords": [...],\n  "industry": "Technology"\n}\nProfile Data: ${JSON.stringify(profileData)}\nDo NOT include any explanation, markdown, or code block. Only output the JSON object.`;
      const res = await fetch('https://linklensai-7.onrender.com/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, profileData }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.response || 'AI analysis failed');
      }

      // Backend may already return a parsed JSON object
      const resp = data.response;
      if (resp && typeof resp === 'object') {
        return resp as Partial<ProfileAnalysis>;
      }

      // Otherwise, try to parse a string response
      if (typeof resp === 'string') {
        try {
          let clean = resp.replace(/```json|```/g, '').trim();
          // Extract first JSON object if extra text wraps it
          const jsonMatch = clean.match(/\{[\s\S]*\}/);
          if (jsonMatch) clean = jsonMatch[0];
          // Remove trailing commas
          clean = clean.replace(/,\s*([}\]])/g, '$1');
          const parsed = JSON.parse(clean);
          return parsed as Partial<ProfileAnalysis>;
        } catch (e) {
          // Fall through to return empty; normalization will handle
          return {} as Partial<ProfileAnalysis>;
        }
      }

      // Unknown format; return empty and let normalization handle
      return {} as Partial<ProfileAnalysis>;
    } catch (error) {
      console.error('Gemini AI analysis error:', error);
      return {};
    }
  }
}

// Export singleton instance
export const aiAnalysisService = new AIAnalysisService();
