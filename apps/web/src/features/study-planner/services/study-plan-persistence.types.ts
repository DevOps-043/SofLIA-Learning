import type { StudyApproach, StudyPlannerCourseOption } from '../types/planner-ui.types';
import type { StudyPlannerStoredLessonDistribution } from '../types/planner-schedule.types';

export type StudyPlannerSessionType = 'short' | 'medium' | 'long';

export interface StudyPlanPreferredTimeBlock {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface StudyPlanSessionLessonPayload {
  courseId?: string;
  courseTitle: string;
  lessonId?: string;
  lessonTitle: string;
  lessonOrderIndex: number;
  durationMinutes: number;
  moduleTitle?: string;
  moduleOrderIndex?: number;
}

export interface StudyPlanSessionPayload {
  clientReferenceId: string;
  title: string;
  description: string;
  courseId: string;
  lessonId?: string;
  plannedLessons: StudyPlanSessionLessonPayload[];
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isAiGenerated: true;
  sessionType: StudyPlannerSessionType;
}

export interface StudyPlanConfigPayload {
  name: string;
  description: string;
  userType: 'b2b' | 'b2c';
  courseIds: string[];
  organizationId?: string;
  goalHoursPerWeek: number;
  startDate: string;
  endDate?: string;
  timezone: string;
  preferredDays: number[];
  preferredTimeBlocks: StudyPlanPreferredTimeBlock[];
  minSessionMinutes: number;
  maxSessionMinutes: number;
  breakDurationMinutes: number;
  preferredSessionType: StudyPlannerSessionType;
  generationMode: 'ai_generated';
  calendarAnalyzed: boolean;
  calendarProvider?: 'google' | 'microsoft';
}

export interface StudyPlanSavePayload {
  planConfig: StudyPlanConfigPayload;
  sessions: StudyPlanSessionPayload[];
}

export interface BuildStudyPlanPayloadParams {
  availableCourses: StudyPlannerCourseOption[];
  connectedCalendar: 'google' | 'microsoft' | null;
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[];
  savedTargetDate: string | null;
  selectedCourseIds: string[];
  studyApproach: StudyApproach | null;
  userType: 'b2b' | null | undefined;
}

export interface SaveStudyPlanApiData {
  planId?: string;
  sessionIds?: string[];
  sessions?: Array<{
    id: string;
    clientReferenceId?: string;
    startTime?: string;
    endTime?: string;
  }>;
}

export interface SyncStudyPlanSessionsResult {
  success: boolean;
  insertedCount: number;
  requiresReconnection: boolean;
}
