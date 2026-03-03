import { API_CONFIG } from '../config/api';
import { ProfileAnalysis } from '../types';

// LinkedIn API service with secure key handling
export class LinkedInApiService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    if (!API_CONFIG.LINKEDIN_API_KEY) {
      throw new Error('LinkedIn API key is required. Please set VITE_LINKEDIN_API_KEY in your .env file.');
    }
    
    this.apiKey = API_CONFIG.LINKEDIN_API_KEY;
    this.baseUrl = API_CONFIG.LINKEDIN_API_URL;
  }

  // Secure headers with API key
  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202405',
    };
  }

  // Extract LinkedIn profile ID from URL
  private extractProfileId(url: string): string {
    const match = url.match(/linkedin\.com\/in\/([^/?]+)/);
    if (!match) {
      throw new Error('Invalid LinkedIn profile URL format');
    }
    return match[1];
  }

  // Generate consistent hash from string for reproducible results
  private generateHashFromString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Generate consistent score within range
  private getConsistentScore(seed: number, min: number, max: number): number {
    const range = max - min;
    return min + (seed % range);
  }

  // Generate consistent strengths based on profile
  private getProfileStrengths(hash: number): string[] {
    const allStrengths = [
      'Professional headline clearly communicates value proposition',
      'Comprehensive work experience with detailed descriptions',
      'Strong network connections within industry',
      'Regular content engagement shows thought leadership',
      'Well-optimized profile with relevant keywords',
      'Active participation in industry discussions',
      'Strong educational background highlighted',
      'Professional profile photo and banner',
      'Detailed skills section with endorsements',
      'Regular posting of industry-relevant content',
      'Strong recommendations from colleagues',
      'Clear career progression demonstrated',
    ];
    
    const numStrengths = 3 + (hash % 3); // 3-5 strengths
    const selectedStrengths: string[] = [];
    
    for (let i = 0; i < numStrengths; i++) {
      const index = (hash + i) % allStrengths.length;
      if (!selectedStrengths.includes(allStrengths[index])) {
        selectedStrengths.push(allStrengths[index]);
      }
    }
    
    return selectedStrengths;
  }

  // Generate consistent improvements based on profile
  private getProfileImprovements(hash: number): string[] {
    const allImprovements = [
      'Add more industry-specific keywords to summary section',
      'Include quantifiable achievements in experience descriptions',
      'Optimize profile for LinkedIn search algorithms',
      'Add multimedia content to showcase work samples',
      'Increase posting frequency to boost engagement',
      'Request more recommendations from colleagues',
      'Update skills section with trending technologies',
      'Add certifications and professional development',
      'Improve profile summary with compelling storytelling',
      'Engage more actively with industry content',
      'Add volunteer experience and causes',
      'Include language proficiencies if applicable',
    ];
    
    const numImprovements = 2 + (hash % 3); // 2-4 improvements
    const selectedImprovements: string[] = [];
    
    for (let i = 0; i < numImprovements; i++) {
      const index = (hash + i + 100) % allImprovements.length;
      if (!selectedImprovements.includes(allImprovements[index])) {
        selectedImprovements.push(allImprovements[index]);
      }
    }
    
    return selectedImprovements;
  }

  // Generate consistent keywords based on profile
  private getProfileKeywords(hash: number): string[] {
    const keywordSets = [
      ['Digital Marketing', 'SEO', 'Content Strategy', 'Social Media', 'Analytics', 'Lead Generation'],
      ['Software Development', 'JavaScript', 'React', 'Node.js', 'Python', 'Cloud Computing'],
      ['Data Science', 'Machine Learning', 'Python', 'SQL', 'Analytics', 'Visualization'],
      ['Product Management', 'Agile', 'Scrum', 'Strategy', 'User Experience', 'Analytics'],
      ['Sales', 'Business Development', 'CRM', 'Lead Generation', 'Negotiation', 'Account Management'],
      ['Human Resources', 'Talent Acquisition', 'Employee Relations', 'Performance Management', 'Training'],
      ['Finance', 'Financial Analysis', 'Budgeting', 'Risk Management', 'Investment', 'Accounting'],
      ['Design', 'UI/UX', 'Adobe Creative Suite', 'Figma', 'User Research', 'Prototyping'],
    ];
    
    const setIndex = hash % keywordSets.length;
    return keywordSets[setIndex];
  }

  // Generate consistent industry based on profile
  private getProfileIndustry(hash: number): string {
    const industries = [
      'Technology',
      'Marketing & Advertising',
      'Finance & Banking',
      'Healthcare',
      'Education',
      'Consulting',
      'Manufacturing',
      'Retail',
      'Media & Communications',
      'Real Estate',
      'Non-profit',
      'Government',
    ];
    
    return industries[hash % industries.length];
  }

  // Fetch profile data from LinkedIn API
  async fetchProfile(profileUrl: string): Promise<Record<string, unknown>> {
    try {
      const profileId = this.extractProfileId(profileUrl);
      
      console.log('🔍 Attempting to fetch LinkedIn profile:', profileId);
      console.log('🔗 API URL:', `${this.baseUrl}/people/(vanityName:${profileId})`);
      
      const response = await fetch(`${this.baseUrl}/people/(vanityName:${profileId})`, {
        method: 'GET',
        headers: this.getHeaders(),
        mode: 'cors', // Explicitly set CORS mode
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        
        if (response.status === 401) {
          throw new Error('Invalid API key or unauthorized access. Please check your LinkedIn API credentials.');
        }
        if (response.status === 403) {
          throw new Error('Access forbidden. Your app may not have the required permissions.');
        }
        if (response.status === 404) {
          throw new Error('LinkedIn profile not found or not accessible.');
        }
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(`LinkedIn API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Successfully fetched profile data');
      return data;
    } catch (error) {
      console.error('❌ LinkedIn API fetch error:', error);
      
      // Check if it's a CORS error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('CORS error: Cannot access LinkedIn API directly from browser. You may need a backend proxy server.');
      }
      
      throw error;
    }
  }

  // Analyze profile using AI (placeholder for actual implementation)
  async analyzeProfile(profileUrl: string): Promise<ProfileAnalysis> {
    try {
      // In production, this would make actual API calls
      console.log('🔍 Analyzing LinkedIn profile:', profileUrl);
      
      // Validate API key before proceeding
      if (!this.apiKey) {
        throw new Error('API key validation failed');
      }

      // Quick analysis simulation (reduced delay)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate consistent mock data based on profile URL
      const profileId = this.extractProfileId(profileUrl);
      const hash = this.generateHashFromString(profileId);
      
      const mockAnalysis: ProfileAnalysis = {
        id: Date.now().toString(),
        profileUrl,
        score: parseFloat((this.getConsistentScore(hash, 60, 95) + Math.random()).toFixed(1)),
        completeness: parseFloat((this.getConsistentScore(hash + 1, 70, 95) + Math.random()).toFixed(1)),
        engagement: parseFloat((this.getConsistentScore(hash + 2, 40, 85) + Math.random()).toFixed(1)),
        visibility: parseFloat((this.getConsistentScore(hash + 3, 50, 90) + Math.random()).toFixed(1)),
        strengths: this.getProfileStrengths(hash),
        improvements: this.getProfileImprovements(hash),
        keywords: this.getProfileKeywords(hash),
        industry: this.getProfileIndustry(hash),
        timestamp: new Date(),
      };

      console.log('✅ Profile analysis completed successfully');
      return mockAnalysis;

    } catch (error) {
      console.error('❌ Profile analysis failed:', error);
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Health check for API connectivity
  async healthCheck(): Promise<boolean> {
    try {
      console.log('🏥 Performing LinkedIn API health check...');
      
      const response = await fetch(`${this.baseUrl}/me`, {
        method: 'GET',
        headers: this.getHeaders(),
        mode: 'cors',
      });
      
      console.log('🏥 Health check response status:', response.status);
      
      if (response.ok) {
        console.log('✅ LinkedIn API health check passed');
        return true;
      } else {
        console.log('❌ LinkedIn API health check failed:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ LinkedIn API health check failed:', error);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('🚫 CORS error detected - LinkedIn API not accessible from browser');
      }
      
      return false;
    }
  }
}

// Export singleton instance
export const linkedInApi = new LinkedInApiService();