import type { Dispatch, SetStateAction } from 'react';
import type {
  StudyApproach,
  StudyPlannerMessage,
} from '../types/planner-ui.types';
import type { StudyPlannerStoredLessonDistribution } from '../types/planner-schedule.types';

export interface StudyPlannerSavedSession {
  conversationHistory?: StudyPlannerMessage[];
  currentStep?: number;
  hasShownFinalSummary?: boolean;
  savedLessonDistribution?: StudyPlannerStoredLessonDistribution[];
  studyApproach?: StudyApproach | null;
  targetDate?: string | null;
  timestamp: string;
}

export interface UseStudyPlannerSessionStorageParams {
  conversationHistory: StudyPlannerMessage[];
  currentStep: number;
  currentUserId: string | null;
  hasShownFinalSummary: boolean;
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[];
  setConversationHistory: Dispatch<SetStateAction<StudyPlannerMessage[]>>;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  setHasShownFinalSummary: Dispatch<SetStateAction<boolean>>;
  setSavedLessonDistribution: Dispatch<SetStateAction<StudyPlannerStoredLessonDistribution[]>>;
  setStudyApproach: Dispatch<SetStateAction<StudyApproach | null>>;
  setTargetDate: Dispatch<SetStateAction<string | null>>;
  showConversation: boolean;
  studyApproach: StudyApproach | null;
  targetDate: string | null;
}

export interface StudyPlannerSessionRestoreParams {
  session: StudyPlannerSavedSession;
  setConversationHistory: Dispatch<SetStateAction<StudyPlannerMessage[]>>;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  setHasShownFinalSummary: Dispatch<SetStateAction<boolean>>;
  setSavedLessonDistribution: Dispatch<SetStateAction<StudyPlannerStoredLessonDistribution[]>>;
  setStudyApproach: Dispatch<SetStateAction<StudyApproach | null>>;
  setTargetDate: Dispatch<SetStateAction<string | null>>;
}
