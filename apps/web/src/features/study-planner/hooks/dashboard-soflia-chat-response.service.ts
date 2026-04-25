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
  sourceUserMessage?: string;
}): DashboardMessage {
  const primaryAction = resolveDashboardPrimaryAction(params.payload);
  const primaryActionData = primaryAction?.data
    ? { ...primaryAction.data }
    : undefined;

  if (
    primaryActionData
    && primaryAction?.status === 'confirmation_needed'
    && params.sourceUserMessage
  ) {
    primaryActionData.userMessage = params.sourceUserMessage;
  }

  return {
    id: `${params.idPrefix}-${Date.now()}`,
    role: 'assistant',
    content: params.payload.response || '',
    timestamp: new Date(),
    actionType: primaryAction?.type,
    actionData: primaryActionData,
    actionStatus: primaryAction?.status,
    actionMessage: primaryAction?.message,
    actionCode: primaryAction?.code,
    traceId: params.payload.traceId || primaryAction?.traceId,
  };
}
