import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * useDashboardLIAAnalysis
 *
 * Sub-hook extracted from useStudyPlannerDashboardLIA.
 * Handles sending messages to LIA, executing study-planner actions,
 * and simple state-reset utilities (clearMessages, clearError, dismissCalendarChanges).
 */

import { useCallback, useRef } from 'react';
import type {
  DashboardMessage,
  StudyPlannerAction,
  StudyPlannerDashboardState,
} from './useStudyPlannerDashboardLIA';

const isAbortError = (error: unknown): error is DOMException =>
  error instanceof DOMException && error.name === 'AbortError';

interface UseDashboardLIAAnalysisParams {
  userId: string | undefined;
  getState: () => StudyPlannerDashboardState;
  setState: React.Dispatch<React.SetStateAction<StudyPlannerDashboardState>>;
  loadActivePlan: () => Promise<void>;
}

interface UseDashboardLIAAnalysisReturn {
  sendMessage: (message: string) => Promise<void>;
  executeAction: (action: StudyPlannerAction, data: Record<string, unknown>) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
  dismissCalendarChanges: () => void;
  abortControllerRef: React.MutableRefObject<AbortController | null>;
}

export function useDashboardLIAAnalysis({
  userId,
  getState,
  setState,
  loadActivePlan,
}: UseDashboardLIAAnalysisParams): UseDashboardLIAAnalysisReturn {
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    const state = getState();
    if (!message.trim() || state.isSending) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userMessage: DashboardMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isSending: true,
      error: null,
    }));

    try {
      const conversationHistory = state.messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/study-planner/dashboard/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationHistory,
          activePlanId: state.activePlan?.id,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Error al comunicarse con LIA');
      }

      const data = await response.json();

      const assistantMessage: DashboardMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        actionType: data.action?.type,
        actionData: data.action?.data,
        actionStatus: data.action?.status,
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isSending: false,
      }));

      if (data.action?.status === 'success') {
        await loadActivePlan();
      }
    } catch (error: unknown) {
      if (isAbortError(error)) return;

      techDebtLogger.error('Error enviando mensaje:', error);
      setState(prev => ({
        ...prev,
        error: 'Error al comunicarse con LIA. Por favor, intenta de nuevo.',
        isSending: false,
      }));
    }
  }, [getState, setState, loadActivePlan]);

  const executeAction = useCallback(async (action: StudyPlannerAction, data: Record<string, unknown>) => {
    const state = getState();
    if (!userId || !state.activePlan) return;

    setState(prev => ({ ...prev, isSending: true }));

    try {
      const response = await fetch('/api/study-planner/dashboard/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          data,
          planId: state.activePlan!.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al ejecutar acción');
      }

      const result = await response.json();

      if (result.success) {
        await loadActivePlan();

        const confirmMessage: DashboardMessage = {
          id: `action-${Date.now()}`,
          role: 'assistant',
          content: result.message || '✅ Acción completada correctamente.',
          timestamp: new Date(),
          actionType: action,
          actionStatus: 'success',
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, confirmMessage],
          isSending: false,
        }));
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      techDebtLogger.error('Error ejecutando acción:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al ejecutar la acción',
        isSending: false,
      }));
    }
  }, [userId, getState, setState, loadActivePlan]);

  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, messages: [] }));
  }, [setState]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, [setState]);

  const dismissCalendarChanges = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasNewCalendarChanges: false,
      calendarChanges: [],
    }));
  }, [setState]);

  return {
    sendMessage,
    executeAction,
    clearMessages,
    clearError,
    dismissCalendarChanges,
    abortControllerRef,
  };
}
