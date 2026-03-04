export type InterviewQuestion = {
  id: string;
  type: 'technical' | 'behavioral' | 'situational' | string;
  text: string;
  competency?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  expectedKeywords?: string[];
  industryContext?: string;
};

export type ScoredAnswer = {
  score: number;
  feedback: string[];
  tips: string[];
  keyCompetencies?: string[];
  strengths?: string[];
  areasForImprovement?: string[];
  technicalAccuracy?: string;
  communicationScore?: string;
};

export type AnswerValidation = {
  isValid: boolean;
  qualityScore: number;
  issues: string[];
  suggestions: string[];
  recommendedLength: string;
  missingElements: string[];
};

export const interviewService = {
  async generateQuestions(params: {
    profile?: any;
    resumeSections?: any;
    targetRole?: string;
    numQuestions?: number;
  }): Promise<InterviewQuestion[]> {
    const res = await fetch('https://linklensai-7.onrender.com/api/interview/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.questions)) {
      throw new Error(data.error || 'Failed to generate questions');
    }
    return data.questions as InterviewQuestion[];
  },

  async getIndustryTemplates(industry: string, role?: string, level?: string): Promise<{ industry: string; role: string; level: string; questions: InterviewQuestion[] }> {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (level) params.append('level', level);
    
    const res = await fetch(`http://localhost:3001/api/interview/industry-templates/${encodeURIComponent(industry)}?${params}`);
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.questions)) {
      throw new Error(data.error || 'Failed to fetch industry templates');
    }
    return data;
  },

  async validateAnswer(params: {
    question: InterviewQuestion;
    answer: string;
    context?: any;
  }): Promise<AnswerValidation> {
    const res = await fetch('http://localhost:3001/api/interview/validate-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to validate answer');
    }
    return data as AnswerValidation;
  },

  async scoreAnswer(params: {
    question: InterviewQuestion;
    answer: string;
    context?: any;
  }): Promise<ScoredAnswer> {
    const res = await fetch('http://localhost:3001/api/interview/score-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || typeof data.score !== 'number') {
      throw new Error(data.error || 'Failed to score answer');
    }
    return data as ScoredAnswer;
  },

  async saveSession(params: {
    userEmail: string;
    targetRole?: string;
    questions: InterviewQuestion[];
    answers: Array<{ questionId: string; answer: string; result: ScoredAnswer }>;
  }): Promise<string> {
    const res = await fetch('http://localhost:3001/api/interview/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || !data.id) {
      throw new Error(data.error || 'Failed to save session');
    }
    return data.id as string;
  },

  async fetchHistory(email: string) {
    const res = await fetch(`http://localhost:3001/api/interview/history?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch history');
    return data.sessions as any[];
  },
};


