import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { LessonData } from './useSofLIAData';
import type {
  StudyApproach,
  StudyPlannerAssignedCourse,
  StudyPlannerCalendarProvider,
  StudyPlannerMessage,
  StudyPlannerPendingLesson,
  StudyPlannerUserContext,
} from '../types/planner-ui.types';
import type { StudyPlannerStoredLessonDistribution } from '../types/planner-schedule.types';

type StateSetter<T> = Dispatch<SetStateAction<T>>;

export interface UseStudyPlannerVoiceQuestionHandlerParams {
  assignedCourses: StudyPlannerAssignedCourse[];
  connectedCalendar: StudyPlannerCalendarProvider;
  conversationHistoryRef: MutableRefObject<StudyPlannerMessage[]>;
  getLessonsForPrompt: (selectedCourseIds?: string[]) => string;
  hasAskedApproach: boolean;
  hasAskedTargetDate: boolean;
  isAudioEnabled: boolean;
  lastVoiceQuestionRef: MutableRefObject<{ text: string; ts: number }>;
  lessons: LessonData[];
  lessonsAreReady: boolean;
  onCourseSelectorRequested: () => void;
  onStudyApproachDetected: (approach: StudyApproach) => Promise<void>;
  onTargetDateDetected: (value: string) => Promise<void>;
  pendingLessonsRef: MutableRefObject<StudyPlannerPendingLesson[]>;
  processingRef: MutableRefObject<boolean>;
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[];
  selectedCourseIds: string[];
  setConversationHistory: StateSetter<StudyPlannerMessage[]>;
  setIsProcessing: StateSetter<boolean>;
  showDateModal: boolean;
  speakText: (text: string) => Promise<void>;
  stopAllAudio: () => void;
  studyApproach: StudyApproach | null;
  targetDate: string | null;
  totalPendingLessons: number;
  userContext: StudyPlannerUserContext | null;
}

export interface UseStudyPlannerVoiceQuestionHandlerResult {
  handleVoiceQuestion: (question: string) => Promise<void>;
}
