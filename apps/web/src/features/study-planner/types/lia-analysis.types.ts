import type { TimeBlock } from './study-preferences.types';

export interface SofLIAAvailabilityAnalysis {
  estimatedWeeklyMinutes: number;
  suggestedMinSessionMinutes: number;
  suggestedMaxSessionMinutes: number;
  suggestedBreakMinutes: number;
  suggestedDays: number[];
  suggestedTimeBlocks: TimeBlock[];
  reasoning: string;
  factorsConsidered: {
    role: string;
    area: string;
    companySize: string;
    level: string;
    calendarAnalysis?: string;
  };
  analyzedAt: string;
}

export interface SofLIATimeAnalysis {
  totalEstimatedMinutes: number;
  courseBreakdown: {
    courseId: string;
    courseTitle: string;
    estimatedMinutes: number;
    complexity: number;
  }[];
  sessionDistribution: {
    totalSessions: number;
    sessionsPerWeek: number;
    weeksToComplete: number;
  };
  meetsDeadlines?: boolean;
  deadlineWarnings?: {
    courseId: string;
    courseTitle: string;
    dueDate: string;
    estimatedCompletionDate: string;
    isAtRisk: boolean;
    suggestedAction: string;
  }[];
  reasoning: string;
  analyzedAt: string;
}
