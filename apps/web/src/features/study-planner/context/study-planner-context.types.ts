import type {
  UserContext,
  StudyPlanConfig,
  StudySession,
  TimeBlock,
  CalendarEvent,
  SofLIAAvailabilityAnalysis,
  SofLIATimeAnalysis,
} from '../types/user-context.types';
import { StudyPlannerPhase } from './study-planner-phase';

export { StudyPlannerPhase } from './study-planner-phase';

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

export type { StudyPlannerAction } from './study-planner-actions.types';

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

export { initialStudyPlannerState } from './study-planner-state.defaults';
