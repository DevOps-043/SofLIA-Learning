export type LessonTab = "summary" | "transcript" | "activities" | "materials";

export interface QuizQuestion {
  correct_answer?: number | string;
  correctAnswer?: number | string;
  explanation?: string;
  id?: string | number;
  options?: string[];
  question?: string;
}

export interface ScriptScene {
  character?: string;
  emotion?: string;
  message?: string;
}

export interface QuizData {
  items?: QuizQuestion[];
  passing_score?: number;
  questions?: QuizQuestion[];
}

export interface ScriptData {
  conclusion?: string;
  introduction?: string;
  scenes?: ScriptScene[];
}
