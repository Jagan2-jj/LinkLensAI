export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  isAuthenticated: boolean;
  isGuest?: boolean;
  linkedinAccessToken?: string;
}

export interface ProfileAnalysis {
  id: string;
  profileUrl: string;
  score: number;
  strengths: string[];
  improvements: string[];
  keywords: string[];
  industry: string;
  completeness: number;
  engagement: number;
  visibility: number;
  timestamp: Date;
  fullName?: string;
  name?: string;
  picture?: string;
}

export interface ParticleConfig {
  count: number;
  speed: number;
  color: string;
  size: number;
  opacity: number;
}

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay: number;
}

export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
}