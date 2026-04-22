import type { DashboardChatSuccessPayload } from './useDashboardSofLIAState.types';
import type { DashboardMessage } from './useStudyPlannerDashboardSofLIA';

export function resolveDashboardPrimaryAction(
  payload: DashboardChatSuccessPayload,
) {
  return payload.action || payload.actions?.[0];
}

export function buildDashboardAssistantMessage(params: {
  idPrefix: string;
  payload: DashboardChatSuccessPayload;
}): DashboardMessage {
  const primaryAction = resolveDashboardPrimaryAction(params.payload);

  return {
    id: `${params.idPrefix}-${Date.now()}`,
    role: 'assistant',
    content: params.payload.response || '',
    timestamp: new Date(),
    actionType: primaryAction?.type,
    actionData: primaryAction?.data,
    actionStatus: primaryAction?.status,
    actionMessage: primaryAction?.message,
    actionCode: primaryAction?.code,
    traceId: params.payload.traceId || primaryAction?.traceId,
  };
}
