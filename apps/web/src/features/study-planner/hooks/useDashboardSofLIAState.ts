/**
 * useDashboardSofLIAState
 *
 * Sub-hook extracted from useStudyPlannerDashboardSofLIA.
 * Handles message sending, action execution, and simple state resets.
 */

import { useCallback, useRef } from 'react';
import { useDashboardSofLIAActionExecution } from './useDashboardSofLIAActionExecution';
import {
  buildDashboardAssistantMessage,
} from './dashboard-soflia-chat-response.service';
import type { DashboardMessage } from './useStudyPlannerDashboardSofLIA';
import type {
  DashboardChatErrorPayload,
  DashboardChatSuccessPayload,
  UseDashboardSofLIAStateParams,
  UseDashboardSofLIAStateReturn,
} from './useDashboardSofLIAState.types';

const isAbortError = (error: unknown): error is DOMException =>
  error instanceof DOMException && error.name === 'AbortError';

export function useDashboardSofLIAState({
  userId,
  getState,
  setState,
  loadActivePlan,
}: UseDashboardSofLIAStateParams): UseDashboardSofLIAStateReturn {
  const abortControllerRef = useRef<AbortController | null>(null);
  const executeAction = useDashboardSofLIAActionExecution({
    userId,
    getState,
    setState,
    loadActivePlan,
  });

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
        const errorData = await response.json().catch(
          () => null as DashboardChatErrorPayload | null,
        );
        throw new Error(
          errorData?.error
          || errorData?.response
          || 'Error al comunicarse con SofLIA',
        );
      }

      const data = await response.json() as DashboardChatSuccessPayload;
      const assistantMessage: DashboardMessage = buildDashboardAssistantMessage({
        idPrefix: 'assistant',
        payload: data,
        sourceUserMessage: message,
      });

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isSending: false,
      }));

      if (assistantMessage.actionStatus === 'success') {
        await loadActivePlan();
      }
    } catch (error: unknown) {
      if (isAbortError(error)) return;

      console.error('Error enviando mensaje:', error);
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'Error al comunicarse con SofLIA. Por favor, intenta de nuevo.',
        isSending: false,
      }));
    }
  }, [getState, setState, loadActivePlan]);

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
