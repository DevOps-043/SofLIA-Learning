import type {
  UserContext,
  StudyPlanConfig,
  StudySession,
  TimeBlock,
  CalendarEvent,
  SofLIAAvailabilityAnalysis,
  SofLIATimeAnalysis,
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

export interface StudyPlannerState {
  currentPhase: StudyPlannerPhase;
  isLoading: boolean;
  error: string | null;
  userContext: UserContext | null;
  planName: string;
  planDescription: string;
  selectedCourseIds: string[];
  learningRouteId?: string;
  minSessionMinutes: number;
  maxSessionMinutes: number;
  breakDurationMinutes: number;
  goalHoursPerWeek: number;
  preferredDays: number[];
  preferredTimeBlocks: TimeBlock[];
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  startDate: string;
  endDate?: string;
  timezone: string;
  calendarConnected: boolean;
  calendarProvider?: 'google' | 'microsoft';
  calendarEvents: CalendarEvent[];
  liaAvailabilityAnalysis?: SofLIAAvailabilityAnalysis;
  liaTimeAnalysis?: SofLIATimeAnalysis;
  generatedConfig?: StudyPlanConfig;
  generatedSessions: StudySession[];
  savedPlanId?: string;
}

export type StudyPlannerAction =
  | { type: 'SET_PHASE'; payload: StudyPlannerPhase }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER_CONTEXT'; payload: UserContext }
  | { type: 'SET_PLAN_NAME'; payload: string }
  | { type: 'SET_PLAN_DESCRIPTION'; payload: string }
  | { type: 'SET_SELECTED_COURSES'; payload: string[] }
  | { type: 'SET_LEARNING_ROUTE'; payload: string | undefined }
  | { type: 'SET_SESSION_TIMES'; payload: { min: number; max: number } }
  | { type: 'SET_BREAK_DURATION'; payload: number }
  | { type: 'SET_GOAL_HOURS'; payload: number }
  | { type: 'SET_PREFERRED_DAYS'; payload: number[] }
  | { type: 'SET_TIME_BLOCKS'; payload: TimeBlock[] }
  | { type: 'SET_TIME_OF_DAY'; payload: 'morning' | 'afternoon' | 'evening' | 'night' }
  | { type: 'SET_START_DATE'; payload: string }
  | { type: 'SET_END_DATE'; payload: string | undefined }
  | { type: 'SET_CALENDAR_CONNECTED'; payload: { connected: boolean; provider?: 'google' | 'microsoft' } }
  | { type: 'SET_CALENDAR_EVENTS'; payload: CalendarEvent[] }
  | { type: 'SET_LIA_AVAILABILITY_ANALYSIS'; payload: SofLIAAvailabilityAnalysis }
  | { type: 'SET_LIA_TIME_ANALYSIS'; payload: SofLIATimeAnalysis }
  | { type: 'SET_GENERATED_PLAN'; payload: { config: StudyPlanConfig; sessions: StudySession[] } }
  | { type: 'SET_SAVED_PLAN_ID'; payload: string }
  | { type: 'RESET' };

export interface StudyPlannerContextValue {
  state: StudyPlannerState;
  actions: {
    setPhase: (phase: StudyPlannerPhase) => void;
    nextPhase: () => void;
    previousPhase: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setUserContext: (context: UserContext) => void;
    setPlanName: (name: string) => void;
    setPlanDescription: (description: string) => void;
    setSelectedCourses: (courseIds: string[]) => void;
    setLearningRoute: (routeId: string | undefined) => void;
    setSessionTimes: (min: number, max: number) => void;
    setBreakDuration: (minutes: number) => void;
    setGoalHours: (hours: number) => void;
    setPreferredDays: (days: number[]) => void;
    setTimeBlocks: (blocks: TimeBlock[]) => void;
    setTimeOfDay: (time: 'morning' | 'afternoon' | 'evening' | 'night') => void;
    setStartDate: (date: string) => void;
    setEndDate: (date: string | undefined) => void;
    setCalendarConnected: (connected: boolean, provider?: 'google' | 'microsoft') => void;
    setCalendarEvents: (events: CalendarEvent[]) => void;
    setSofLIAAvailabilityAnalysis: (analysis: SofLIAAvailabilityAnalysis) => void;
    setSofLIATimeAnalysis: (analysis: SofLIATimeAnalysis) => void;
    setGeneratedPlan: (config: StudyPlanConfig, sessions: StudySession[]) => void;
    setSavedPlanId: (planId: string) => void;
    reset: () => void;
    loadUserContext: () => Promise<void>;
    generatePlan: () => Promise<void>;
    savePlan: () => Promise<string | null>;
  };
}

export const initialStudyPlannerState: StudyPlannerState = {
  currentPhase: StudyPlannerPhase.WELCOME,
  isLoading: false,
  error: null,
  userContext: null,
  planName: 'Mi Plan de Estudios',
  planDescription: '',
  selectedCourseIds: [],
  minSessionMinutes: 25,
  maxSessionMinutes: 45,
  breakDurationMinutes: 10,
  goalHoursPerWeek: 5,
  preferredDays: [1, 2, 3, 4, 5],
  preferredTimeBlocks: [],
  preferredTimeOfDay: 'morning',
  startDate: new Date().toISOString().split('T')[0],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  calendarConnected: false,
  calendarEvents: [],
  generatedSessions: [],
};
