import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type {
  StudyApproach,
  StudyPlannerMessage,
  StudyPlannerPendingLesson,
} from '../types/planner-ui.types';

export interface StudyPlannerB2BProfile {
  organization?: {
    name?: string | null;
  } | null;
  professionalProfile?: {
    area?: { nombre?: string | null } | null;
    nivel?: { nombre?: string | null } | null;
    rol?: { nombre?: string | null } | null;
  } | null;
}

export interface StudyPlannerMetadataLesson {
  durationSeconds?: number;
  lessonId: string;
  lessonOrderIndex?: number;
  lessonTitle?: string;
  totalDurationMinutes?: number;
}

export interface StudyPlannerMetadataModule {
  lessons?: StudyPlannerMetadataLesson[];
  moduleOrderIndex?: number;
  moduleTitle?: string;
}

export interface StudyPlannerCourseAnalysis {
  completedLessons: number;
  courseId: string;
  daysUntilDeadline: number;
  dueDate: string;
  dueDateObj: Date;
  pendingLessons: number;
  pendingLessonsDetails: Array<{
    durationMinutes: number;
    lessonId: string;
    lessonOrderIndex: number;
    lessonTitle: string;
    moduleOrderIndex: number;
    moduleTitle: string;
  }>;
  title: string;
  totalLessons: number;
  weeksUntilDeadline: number;
}

export interface UseStudyPlannerB2BCalendarAnalysisParams {
  analyzeCalendarAndSuggest: (
    provider: string,
    effectiveTargetDate?: string,
    effectiveApproach?: StudyApproach,
    skipB2BRedirect?: boolean,
  ) => Promise<void>;
  pendingLessonsRef: MutableRefObject<StudyPlannerPendingLesson[]>;
  selectedCourseIds: string[];
  setConversationHistory: Dispatch<SetStateAction<StudyPlannerMessage[]>>;
  setIsProcessing: Dispatch<SetStateAction<boolean>>;
  setPendingLessonsWithNames: Dispatch<SetStateAction<StudyPlannerPendingLesson[]>>;
  setSelectedCourseIds: Dispatch<SetStateAction<string[]>>;
  setTargetDate: Dispatch<SetStateAction<string | null>>;
}
