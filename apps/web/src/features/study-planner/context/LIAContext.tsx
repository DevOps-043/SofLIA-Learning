'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import {
  type CourseInfo,
  type CourseInfoResponse,
  type LIAContextValue,
  type LIAContextState,
  type StudyPreferences,
  type PendingLesson,
  initialLIAContextState,
} from './lia-context.types';
import { buildContextForPrompt, buildLessonsListForPrompt } from './lia-context-prompt';

export type {
  PendingLesson,
  CourseInfo,
  UserProfile,
  CalendarState,
  StudyPreferences,
  LIAContextState,
  LIAContextActions,
  LIAContextValue,
} from './lia-context.types';
export { LIA_PANEL_WIDTH } from './lia-context.types';

const LIAContext = createContext<LIAContextValue | null>(null);

export function LIAProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LIAContextState>(initialLIAContextState);
  const loadedRef = useRef(false);

  const loadUserData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const userResponse = await fetch('/api/study-planner/user-context');
      if (!userResponse.ok) throw new Error('Error obteniendo contexto de usuario');
      const userData = await userResponse.json();

      if (userData.success && userData.data) {
        const data = userData.data;
        setState((prev) => ({
          ...prev,
          userProfile: {
            userId: data.user?.id || '',
            userName: data.user?.firstName || data.user?.displayName || data.user?.username || null,
            userType: data.userType || null,
            rol: data.professionalProfile?.rol?.nombre || null,
            area: data.professionalProfile?.area?.nombre || null,
            nivel: data.professionalProfile?.nivel?.nombre || null,
            organizationName: data.organization?.name || null,
          },
        }));
      }

      const calendarResponse = await fetch('/api/study-planner/calendar/status');
      if (calendarResponse.ok) {
        const calendarData = await calendarResponse.json();
        if (calendarData.isConnected && calendarData.provider) {
          setState((prev) => ({
            ...prev,
            calendar: { ...prev.calendar, isConnected: true, provider: calendarData.provider },
          }));
        }
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    } catch (error) {
      console.error('❌ [LIAContext] Error cargando datos del usuario:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error desconocido',
        isLoading: false,
      }));
    }
  }, []);

  const loadPendingLessons = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/study-planner/pending-lessons');
      if (!response.ok) throw new Error(`Error en pending-lessons: ${response.status}`);

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Error obteniendo lecciones');

      const courses: CourseInfo[] = ((data.courses || []) as CourseInfoResponse[]).map((c) => ({
        courseId: c.courseId,
        courseTitle: c.courseTitle,
        dueDate: c.dueDate || null,
        totalLessons: c.totalLessons || 0,
        completedLessons: c.completedLessons || 0,
        pendingCount: c.pendingCount || 0,
        pendingLessons: (c.pendingLessons || []).map((l) => ({
          lessonId: l.lessonId,
          lessonTitle: l.lessonTitle,
          lessonOrderIndex: l.lessonOrderIndex,
          durationMinutes: l.durationMinutes || 15,
          moduleId: l.moduleId,
          moduleTitle: l.moduleTitle,
          moduleOrderIndex: l.moduleOrderIndex,
          courseId: c.courseId,
          courseTitle: c.courseTitle,
        })),
      }));

      const allPendingLessons: PendingLesson[] = data.allPendingLessons || [];

      setState((prev) => ({
        ...prev,
        courses,
        allPendingLessons,
        totalPendingLessons: data.totalPendingLessons || allPendingLessons.length,
        isLoading: false,
        isReady: true,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('❌ [LIAContext] Error cargando lecciones:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error desconocido',
        isLoading: false,
      }));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await loadUserData();
    await loadPendingLessons();
  }, [loadUserData, loadPendingLessons]);

  const setCalendarConnected = useCallback((provider: 'google' | 'microsoft') => {
    setState((prev) => ({ ...prev, calendar: { isConnected: true, provider, wasSkipped: false } }));
  }, []);

  const skipCalendar = useCallback(() => {
    setState((prev) => ({ ...prev, calendar: { ...prev.calendar, wasSkipped: true } }));
  }, []);

  const setPreferences = useCallback((prefs: Partial<StudyPreferences>) => {
    setState((prev) => ({ ...prev, preferences: { ...prev.preferences, ...prefs } }));
  }, []);

  const getContextForPrompt = useCallback(() => buildContextForPrompt(state), [state]);
  const getLessonsListForPrompt = useCallback(
    () => buildLessonsListForPrompt(state.allPendingLessons),
    [state.allPendingLessons],
  );

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      void refreshAll();
    }
  }, [refreshAll]);

  return (
    <LIAContext.Provider
      value={{
        state,
        actions: {
          loadUserData, loadPendingLessons, refreshAll,
          setCalendarConnected, skipCalendar, setPreferences,
          getContextForPrompt, getLessonsListForPrompt,
        },
      }}
    >
      {children}
    </LIAContext.Provider>
  );
}

export function useLIA() {
  const context = useContext(LIAContext);
  if (!context) throw new Error('useLIA debe usarse dentro de LIAProvider');
  return context;
}

export default LIAContext;
