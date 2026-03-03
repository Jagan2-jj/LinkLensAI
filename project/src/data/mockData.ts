import { ProfileAnalysis } from '../types';

export const generateMockAnalysis = (url: string): ProfileAnalysis => {
  const scores = {
    score: Math.floor(Math.random() * 40) + 60, // 60-100
    completeness: Math.floor(Math.random() * 30) + 70, // 70-100
    engagement: Math.floor(Math.random() * 50) + 40, // 40-90
    visibility: Math.floor(Math.random() * 40) + 50, // 50-90
  };

  const strengths = [
    'Professional headline clearly states your value proposition',
    'Comprehensive work experience with detailed descriptions',
    'Strong network with industry connections',
    'Regular content posting shows thought leadership',
    'Professional profile photo creates great first impression',
    'Industry-specific keywords boost search visibility',
  ];

  const improvements = [
    'Add more industry-specific keywords to your summary',
    'Include quantifiable achievements in experience descriptions',
    'Optimize your profile for LinkedIn search algorithms',
    'Add more multimedia content to showcase your work',
    'Engage more with your network through comments and shares',
    'Request recommendations from colleagues and clients',
    'Update your skills section with trending technologies',
  ];

  const keywords = [
    'Digital Marketing',
    'SEO',
    'Content Strategy',
    'Social Media',
    'Analytics',
    'Lead Generation',
    'Marketing Automation',
    'Brand Management',
    'Customer Acquisition',
    'Growth Hacking',
  ];

  return {
    id: Date.now().toString(),
    profileUrl: url,
    score: scores.score,
    completeness: scores.completeness,
    engagement: scores.engagement,
    visibility: scores.visibility,
    strengths: strengths.slice(0, Math.floor(Math.random() * 3) + 3),
    improvements: improvements.slice(0, Math.floor(Math.random() * 3) + 4),
    keywords: keywords.slice(0, Math.floor(Math.random() * 5) + 5),
    industry: 'Technology',
    timestamp: new Date(),
  };
};