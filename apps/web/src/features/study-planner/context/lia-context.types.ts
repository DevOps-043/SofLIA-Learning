'use client';

export interface PendingLesson {
  lessonId: string;
  lessonTitle: string;
  lessonOrderIndex: number;
  durationMinutes: number;
  moduleId: string;
  moduleTitle: string;
  moduleOrderIndex: number;
  courseId: string;
  courseTitle: string;
}

export interface CourseInfo {
  courseId: string;
  courseTitle: string;
  dueDate: string | null;
  totalLessons: number;
  completedLessons: number;
  pendingCount: number;
  pendingLessons: PendingLesson[];
}

export interface PendingLessonResponse {
  lessonId: string;
  lessonTitle: string;
  lessonOrderIndex: number;
  durationMinutes?: number | null;
  moduleId: string;
  moduleTitle: string;
  moduleOrderIndex: number;
}

export interface CourseInfoResponse {
  courseId: string;
  courseTitle: string;
  dueDate?: string | null;
  totalLessons?: number | null;
  completedLessons?: number | null;
  pendingCount?: number | null;
  pendingLessons?: PendingLessonResponse[] | null;
}

export interface UserProfile {
  userId: string;
  userName: string | null;
  userType: 'b2b' | 'b2c' | null;
  rol: string | null;
  area: string | null;
  nivel: string | null;
  organizationName: string | null;
}

export interface CalendarState {
  isConnected: boolean;
  provider: 'google' | 'microsoft' | null;
  wasSkipped: boolean;
}

export interface StudyPreferences {
  approach: 'corto' | 'balance' | 'largo' | null;
  targetDate: string | null;
  preferredDays: string[];
  preferredTimes: string[];
}

export interface LIAContextState {
  userProfile: UserProfile | null;
  courses: CourseInfo[];
  allPendingLessons: PendingLesson[];
  totalPendingLessons: number;
  calendar: CalendarState;
  preferences: StudyPreferences;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface LIAContextActions {
  loadUserData: () => Promise<void>;
  loadPendingLessons: () => Promise<void>;
  refreshAll: () => Promise<void>;
  setCalendarConnected: (provider: 'google' | 'microsoft') => void;
  skipCalendar: () => void;
  setPreferences: (prefs: Partial<StudyPreferences>) => void;
  getContextForPrompt: () => string;
  getLessonsListForPrompt: () => string;
}

export interface LIAContextValue {
  state: LIAContextState;
  actions: LIAContextActions;
}

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
