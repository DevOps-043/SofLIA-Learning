import { useCallback } from 'react';
import type {
  DashboardMessage,
  StudyPlannerAction,
} from './useStudyPlannerDashboardSofLIA';
import type {
  DashboardChatActionExecutionPayload,
  UseDashboardSofLIAStateParams,
} from './useDashboardSofLIAState.types';

type UseDashboardSofLIAActionExecutionParams = Pick<
  UseDashboardSofLIAStateParams,
  'userId' | 'getState' | 'setState' | 'loadActivePlan'
>;

export function useDashboardSofLIAActionExecution({
  userId,
  getState,
  setState,
  loadActivePlan,
}: UseDashboardSofLIAActionExecutionParams) {
  return useCallback(async (action: StudyPlannerAction, data: Record<string, unknown>) => {
    const state = getState();
    if (!userId || !state.activePlan) return;

    const traceId =
      typeof data.traceId === 'string' && data.traceId.trim()
        ? data.traceId
        : undefined;
    const userMessage =
      typeof data.userMessage === 'string' && data.userMessage.trim()
        ? data.userMessage
        : undefined;

    const payloadData = { ...data };
    delete payloadData.traceId;
    delete payloadData.userMessage;

    setState(prev => ({ ...prev, error: null, isSending: true }));

    try {
      const response = await fetch('/api/study-planner/dashboard/chat/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          data: payloadData,
          planId: state.activePlan.id,
          traceId,
          userMessage,
        }),
      });

      const result = await response.json().catch(
        () => null as DashboardChatActionExecutionPayload | null,
      );

      if (!response.ok) {
        throw new Error(
          result?.error
          || result?.message
          || 'No se pudo ejecutar la accion confirmada.',
        );
      }

      const actionResult = result?.action;
      const actionStatus = actionResult?.status || (result?.success ? 'success' : 'error');
      const actionMessage =
        actionResult?.message
        || result?.message
        || (actionStatus === 'success'
          ? 'Accion completada correctamente.'
          : 'No se pudo ejecutar la accion.');
      const actionTraceId = result?.traceId || actionResult?.traceId || traceId;

      if (actionStatus === 'success') {
        await loadActivePlan();

        const confirmMessage: DashboardMessage = {
          id: `action-${Date.now()}`,
          role: 'assistant',
          content: actionMessage,
          timestamp: new Date(),
          actionType: action,
          actionCode: actionResult?.code,
          actionData: payloadData,
          actionMessage,
          actionStatus: 'success',
          traceId: actionTraceId,
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, confirmMessage],
          isSending: false,
        }));
        return;
      }

      const followUpMessage: DashboardMessage = {
        id: `action-${Date.now()}`,
        role: 'assistant',
        content: actionMessage,
        timestamp: new Date(),
        actionType: action,
        actionCode: actionResult?.code,
        actionData: actionResult?.data as Record<string, unknown> | undefined,
        actionMessage,
        actionStatus: actionStatus === 'confirmation_needed' ? 'confirmation_needed' : 'error',
        traceId: actionTraceId,
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, followUpMessage],
        isSending: false,
      }));
    } catch (error: unknown) {
      console.error('Error ejecutando accion:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Error al ejecutar la accion';
      const failedActionMessage: DashboardMessage = {
        id: `action-error-${Date.now()}`,
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
        actionType: action,
        actionData: payloadData,
        actionMessage: errorMessage,
        actionStatus: 'error',
        traceId,
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, failedActionMessage],
        isSending: false,
      }));
    }
  }, [userId, getState, setState, loadActivePlan]);
}
