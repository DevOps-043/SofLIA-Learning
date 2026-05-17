import type {
  CalendarEvent,
  SofLIAAvailabilityAnalysis,
  SofLIATimeAnalysis,
  StudyPlanConfig,
  StudySession,
  TimeBlock,
  UserContext,
} from '../types/user-context.types';
import type { StudyPlannerPhase } from './study-planner-phase';

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
