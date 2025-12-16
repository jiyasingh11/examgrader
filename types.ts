
export interface PracticeQuestion {
  question: string;
  answer: string;
  explanation: string;
}

export interface GradedProblem {
  id: number;
  questionText: string;
  studentResponse: string;
  correctResponse: string;
  isCorrect: boolean;
  feedback: string;
}

export interface GradingReport {
  isHomework: boolean;
  subject: string;
  subjectConfidenceScore: number;
  alternativeSubjects?: string[];
  summary: string;
  totalScore: number; // 0 to 100
  letterGrade: string;
  problems: GradedProblem[];
  practiceQuestions: PracticeQuestion[];
}

export type AppState = 'IDLE' | 'ANALYZING' | 'RESULTS' | 'ERROR';

export interface AnalysisError {
  message: string;
  details?: string;
}

export type StrictnessLevel = 'lenient' | 'standard' | 'strict';
export type GradingFocus = 'logic' | 'result' | 'formatting';

export interface GradingPreferences {
  strictness: StrictnessLevel;
  focus: GradingFocus;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ImageInput {
  base64: string;
  mimeType: string;
}
