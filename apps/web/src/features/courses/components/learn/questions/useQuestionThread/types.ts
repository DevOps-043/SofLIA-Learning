import type { CourseQuestion, CourseQuestionResponse } from '../types';

export interface UseQuestionThreadOptions {
  questionId: string;
  slug: string;
}

export interface QuestionThreadSnapshot {
  question: CourseQuestion | null;
  responses: CourseQuestionResponse[];
}

export type ResponseReactions = Record<string, string>;
export type ResponseReactionCounts = Record<string, number>;
