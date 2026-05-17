import type { LIAContextState } from './lia-context.types';

export const initialLIAContextState: LIAContextState = {
  userProfile: null,
  courses: [],
  allPendingLessons: [],
  totalPendingLessons: 0,
  calendar: {
    isConnected: false,
    provider: null,
    wasSkipped: false,
  },
  preferences: {
    approach: null,
    targetDate: null,
    preferredDays: [],
    preferredTimes: [],
  },
  isLoading: false,
  isReady: false,
  error: null,
  lastUpdated: null,
};

export const LIA_PANEL_WIDTH = 420;
