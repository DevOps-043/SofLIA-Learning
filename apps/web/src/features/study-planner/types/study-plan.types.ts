import type { UserType, SessionType, CalendarProvider } from './user-profile.types';
import type { TimeBlock, StudyPreferences } from './study-preferences.types';
import type { CourseAssignment } from './course-assignment.types';
import type { SofLIAAvailabilityAnalysis, SofLIATimeAnalysis } from './lia-analysis.types';

export interface StudyPlanConfig {
  name: string;
  description?: string;
  userType: UserType;
  courseIds: string[];
  learningRouteId?: string;
  goalHoursPerWeek: number;
  startDate?: string;
  endDate?: string;
  timezone: string;
  preferredDays: number[];
  preferredTimeBlocks: TimeBlock[];
  minSessionMinutes: number;
  maxSessionMinutes: number;
  breakDurationMinutes: number;
  preferredSessionType: SessionType;
  generationMode: import('./user-profile.types').PlanGenerationMode;
  sofLiaAvailabilityAnalysis?: SofLIAAvailabilityAnalysis;
  sofLiaTimeAnalysis?: SofLIATimeAnalysis;
  calendarAnalyzed: boolean;
  calendarProvider?: CalendarProvider;
}

export interface StudySession {
  id: string;
  planId: string;
  userId: string;
  title: string;
  description?: string;
  courseId: string;
  lessonId?: string;
  lessonTitle?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  breakDurationMinutes?: number;
  status: 'planned' | 'in_progress' | 'completed' | 'missed' | 'rescheduled';
  isAiGenerated: boolean;
  sofLiaSuggested: boolean;
  sessionType: SessionType;
  dueDate?: string;
  calendarConflictChecked: boolean;
}

export interface StudyPlan {
  id: string;
  userId: string;
  config: StudyPlanConfig;
  sessions: StudySession[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type CoursesResponse = ApiResponse<CourseAssignment[]>;
export type SofLIAAnalysisResponse = ApiResponse<{
  availabilityAnalysis: SofLIAAvailabilityAnalysis;
  timeAnalysis: SofLIATimeAnalysis;
}>;
export type StudyPlanResponse = ApiResponse<StudyPlan>;
