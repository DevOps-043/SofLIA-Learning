import { type StudyPlannerState, type StudyPlannerAction, initialStudyPlannerState } from './study-planner-context.types';

export function studyPlannerReducer(
  state: StudyPlannerState,
  action: StudyPlannerAction,
): StudyPlannerState {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, currentPhase: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_USER_CONTEXT':
      return {
        ...state,
        userContext: action.payload,
        selectedCourseIds: action.payload.courses.map((c) => c.courseId),
        calendarConnected: action.payload.calendarIntegration?.isConnected || false,
        calendarProvider: action.payload.calendarIntegration?.provider,
      };
    case 'SET_PLAN_NAME':
      return { ...state, planName: action.payload };
    case 'SET_PLAN_DESCRIPTION':
      return { ...state, planDescription: action.payload };
    case 'SET_SELECTED_COURSES':
      return { ...state, selectedCourseIds: action.payload };
    case 'SET_LEARNING_ROUTE':
      return { ...state, learningRouteId: action.payload };
    case 'SET_SESSION_TIMES':
      return { ...state, minSessionMinutes: action.payload.min, maxSessionMinutes: action.payload.max };
    case 'SET_BREAK_DURATION':
      return { ...state, breakDurationMinutes: action.payload };
    case 'SET_GOAL_HOURS':
      return { ...state, goalHoursPerWeek: action.payload };
    case 'SET_PREFERRED_DAYS':
      return { ...state, preferredDays: action.payload };
    case 'SET_TIME_BLOCKS':
      return { ...state, preferredTimeBlocks: action.payload };
    case 'SET_TIME_OF_DAY':
      return { ...state, preferredTimeOfDay: action.payload };
    case 'SET_START_DATE':
      return { ...state, startDate: action.payload };
    case 'SET_END_DATE':
      return { ...state, endDate: action.payload };
    case 'SET_CALENDAR_CONNECTED':
      return { ...state, calendarConnected: action.payload.connected, calendarProvider: action.payload.provider };
    case 'SET_CALENDAR_EVENTS':
      return { ...state, calendarEvents: action.payload };
    case 'SET_LIA_AVAILABILITY_ANALYSIS':
      return { ...state, liaAvailabilityAnalysis: action.payload };
    case 'SET_LIA_TIME_ANALYSIS':
      return { ...state, liaTimeAnalysis: action.payload };
    case 'SET_GENERATED_PLAN':
      return { ...state, generatedConfig: action.payload.config, generatedSessions: action.payload.sessions };
    case 'SET_SAVED_PLAN_ID':
      return { ...state, savedPlanId: action.payload };
    case 'RESET':
      return initialStudyPlannerState;
    default:
      return state;
  }
}
