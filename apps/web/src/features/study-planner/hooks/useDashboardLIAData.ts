import { useCallback, useRef } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type {
  ActiveStudyPlan,
  CalendarChange,
  DashboardMessage,
  StudyPlannerDashboardState,
} from './useStudyPlannerDashboardLIA';
import { formatCalendarChangesMessage } from './dashboard-calendar-changes-message';
import {
  CALENDAR_CHECK_INTERVAL,
  createLoadingPlanMessage,
  createNoPlanMessage,
} from './dashboard-lia-initial-messages';
import { loadProactiveAnalysis } from './dashboard-lia-proactive-analysis';

interface UseDashboardLIADataParams {
  userId: string | undefined;
  setState: Dispatch<SetStateAction<StudyPlannerDashboardState>>;
  getMessagesLength: () => number;
}

interface UseDashboardLIADataReturn {
  loadActivePlan: () => Promise<void>;
  checkCalendarChanges: () => Promise<void>;
  checkCalendarChangesIfNeeded: () => Promise<void>;
  hasCheckedCalendarRef: MutableRefObject<boolean>;
}

export function useDashboardLIAData({
  userId,
  setState,
  getMessagesLength,
}: UseDashboardLIADataParams): UseDashboardLIADataReturn {
  const hasCheckedCalendarRef = useRef(false);

  const loadActivePlan = useCallback(async () => {
    if (!userId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/study-planner/dashboard/plan');
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setState(prev => ({
            ...prev,
            activePlan: null,
            isLoading: false,
            messages: [createNoPlanMessage()],
          }));
          return;
        }

        console.error('Error del servidor:', data.error || response.statusText);
        throw new Error(data.error || 'Error al cargar el plan de estudios');
      }

      if (!data.success || !data.data) {
        setState(prev => ({ ...prev, activePlan: null, isLoading: false }));
        return;
      }

      const plan: ActiveStudyPlan = data.data;
      const isFirstLoad = getMessagesLength() === 0;

      setState(prev => ({
        ...prev,
        activePlan: plan,
        isLoading: false,
        messages: prev.messages.length === 0 ? [createLoadingPlanMessage()] : prev.messages,
      }));

      if (isFirstLoad) {
        await loadProactiveAnalysis(plan, setState);
      }
    } catch (error) {
      console.error('Error cargando plan activo:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al cargar tu plan de estudios',
        isLoading: false,
      }));
    }
  }, [userId, setState, getMessagesLength]);

  const checkCalendarChanges = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch('/api/study-planner/calendar/check-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Error al verificar calendario');
      }

      const data = await response.json();
      const now = new Date();
      localStorage.setItem(`calendar_check_${userId}`, now.toISOString());

      if (!data.success || !data.data) {
        setState(prev => ({
          ...prev,
          lastCalendarCheck: now,
          hasNewCalendarChanges: false,
        }));
        return;
      }

      const changes: CalendarChange[] = data.data.changes || [];
      if (changes.length === 0) {
        setState(prev => ({
          ...prev,
          lastCalendarCheck: now,
          hasNewCalendarChanges: false,
          calendarChanges: [],
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        calendarChanges: changes,
        lastCalendarCheck: now,
        hasNewCalendarChanges: true,
      }));

      loadActivePlan().catch(err =>
        console.error('Error recargando plan despues de cambios:', err),
      );
      appendCalendarChangesMessage(changes, now, setState);
    } catch (error) {
      console.error('Error verificando calendario:', error);
    }
  }, [userId, setState, loadActivePlan]);

  const checkCalendarChangesIfNeeded = useCallback(async () => {
    if (!userId) return;

    try {
      const lastCheckStr = localStorage.getItem(`calendar_check_${userId}`);
      const lastCheck = lastCheckStr ? new Date(lastCheckStr) : null;
      const now = new Date();

      if (lastCheck && now.getTime() - lastCheck.getTime() < CALENDAR_CHECK_INTERVAL) {
        setState(prev => ({ ...prev, lastCalendarCheck: lastCheck }));
        return;
      }

      await checkCalendarChanges();
    } catch (error) {
      console.error('Error verificando calendario:', error);
    }
  }, [userId, setState, checkCalendarChanges]);

  return {
    loadActivePlan,
    checkCalendarChanges,
    checkCalendarChangesIfNeeded,
    hasCheckedCalendarRef,
  };
}

function appendCalendarChangesMessage(
  changes: CalendarChange[],
  now: Date,
  setState: Dispatch<SetStateAction<StudyPlannerDashboardState>>,
) {
  const changeMessage: DashboardMessage = {
    id: `calendar-changes-${Date.now()}`,
    role: 'assistant',
    content: formatCalendarChangesMessage(changes),
    timestamp: now,
  };

  setState(prev => {
    const recentChangeMessage = prev.messages.find(message =>
      message.role === 'assistant'
      && message.content.includes('cambios importantes en tu calendario')
      && now.getTime() - message.timestamp.getTime() < 5 * 60 * 1000,
    );

    return recentChangeMessage
      ? prev
      : { ...prev, messages: [...prev.messages, changeMessage] };
  });
}
