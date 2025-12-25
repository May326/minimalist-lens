
export type Language = 'en' | 'zh';

export enum AppStep {
  UPLOAD = 'UPLOAD',
  ANALYZING_IMAGE = 'ANALYZING_IMAGE',
  QUESTIONS = 'QUESTIONS',
  GENERATING_ADVICE = 'GENERATING_ADVICE',
  ADVICE = 'ADVICE',
  HISTORY = 'HISTORY'
}

export interface QuestionSet {
  questions: string[];
}

export interface AdviceResult {
  summary: string;
  tips: string[];
  philosophicalReflection: string;
}

export interface MinimalistSession {
  id: string;
  timestamp: number;
  image: string;
  questions: string[];
  answers: string[];
  advice: AdviceResult;
  language: Language;
}
