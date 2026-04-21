import type {
  UserContext,
  StudySession,
  TimeBlock,
  CalendarEvent,
  SofLIAAvailabilityAnalysis,
} from '../types/user-context.types';

export enum StudyPlannerPhase {
  WELCOME = 0,
  CONTEXT_ANALYSIS = 1,
  COURSE_SELECTION = 2,
  CALENDAR_INTEGRATION = 3,
  TIME_CONFIGURATION = 4,
  BREAK_CONFIGURATION = 5,
  SCHEDULE_CONFIGURATION = 6,
  SUMMARY = 7,
  COMPLETE = 8,
}

export interface PhaseData {
  userContext?: UserContext;
  availabilityAnalysis?: SofLIAAvailabilityAnalysis;
  selectedCourseIds?: string[];
  learningRouteId?: string;
  calendarConnected?: boolean;
  calendarProvider?: 'google' | 'microsoft';
  calendarEvents?: CalendarEvent[];
  minSessionMinutes?: number;
  maxSessionMinutes?: number;
  breakDurationMinutes?: number;
  preferredDays?: number[];
  preferredTimeBlocks?: TimeBlock[];
  preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  planName?: string;
  planDescription?: string;
  goalHoursPerWeek?: number;
  startDate?: string;
  endDate?: string;
  generatedSessions?: StudySession[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  phase?: StudyPlannerPhase;
}

export interface StudyPlannerSofLIAState {
  currentPhase: StudyPlannerPhase;
  phaseData: PhaseData;
  messages: Message[];
  isLoading: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  error: string | null;
}

export interface StudyPlannerSofLIAActions {
  sendMessage: (message: string) => Promise<void>;
  sendVoiceMessage: (transcript: string) => Promise<void>;
  goToPhase: (phase: StudyPlannerPhase) => void;
  nextPhase: () => void;
  previousPhase: () => void;
  updatePhaseData: (data: Partial<PhaseData>) => void;
  setIsListening: (listening: boolean) => void;
  setIsSpeaking: (speaking: boolean) => void;
  generatePlan: () => Promise<void>;
  savePlan: () => Promise<{ planId: string; sessionIds: string[] } | null>;
  clearError: () => void;
  reset: () => void;
}

export const initialSofLIAState: StudyPlannerSofLIAState = {
  currentPhase: StudyPlannerPhase.WELCOME,
  phaseData: {},
  messages: [],
  isLoading: false,
  isListening: false,
  isSpeaking: false,
  error: null,
};

export function getSessionType(maxMinutes: number): 'short' | 'medium' | 'long' {
  if (maxMinutes <= 25) return 'short';
  if (maxMinutes <= 45) return 'medium';
  return 'long';
}
