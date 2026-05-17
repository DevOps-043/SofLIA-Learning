import type { StudyPlannerState } from './study-planner-context.types';
import { StudyPlannerPhase } from './study-planner-phase';

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
