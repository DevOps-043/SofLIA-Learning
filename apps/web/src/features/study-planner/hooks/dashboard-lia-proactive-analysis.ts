import { logger as techDebtLogger } from '@/lib/utils/logger'
import type { Dispatch, SetStateAction } from 'react';
import type {
  ActiveStudyPlan,
  DashboardMessage,
  StudyPlannerAction,
  StudyPlannerDashboardState,
} from './useStudyPlannerDashboardLIA';
import {
  buildDashboardAssistantMessage,
  resolveDashboardPrimaryAction,
} from './dashboard-soflia-chat-response.service';
import { createDashboardWelcomeMessage } from './dashboard-lia-initial-messages';
import type { DashboardChatSuccessPayload } from './useDashboardSofLIAState.types';

const legacyActionTypes = new Set<StudyPlannerAction>([
  'move_session',
  'delete_session',
  'resize_session',
  'create_session',
  'update_session',
  'reschedule_week',
  'analyze_calendar',
  'suggest_adjustments',
  'get_plan_summary',
]);

function isLegacyAction(value: unknown): value is StudyPlannerAction {
  return typeof value === 'string' && legacyActionTypes.has(value as StudyPlannerAction);
}

function isLegacyStatus(value: unknown): value is DashboardMessage['actionStatus'] {
  return value === 'pending' || value === 'success' || value === 'error';
}

function toLegacyDashboardMessage(message: {
  id: string;
  role: DashboardMessage['role'];
  content: string;
  timestamp: Date;
  actionType?: unknown;
  actionData?: Record<string, unknown>;
  actionStatus?: unknown;
}): DashboardMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: message.timestamp,
    ...(isLegacyAction(message.actionType) ? { actionType: message.actionType } : {}),
    ...(message.actionData ? { actionData: message.actionData } : {}),
    ...(isLegacyStatus(message.actionStatus) ? { actionStatus: message.actionStatus } : {}),
  };
}

export async function loadProactiveAnalysis(
  plan: ActiveStudyPlan,
  setState: Dispatch<SetStateAction<StudyPlannerDashboardState>>,
) {
  try {
    const response = await fetch('/api/study-planner/dashboard/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trigger: 'proactive_init',
        activePlanId: plan.id,
        conversationHistory: [],
      }),
    });
    const chatData = await response.json() as DashboardChatSuccessPayload;

    if (!chatData.success || !chatData.response) {
      techDebtLogger.warn('[SofLIA Dashboard] Respuesta sin exito:', chatData.error || 'Sin respuesta');
      throw new Error(chatData.error || 'Sin respuesta del analisis');
    }

    setState(prev => ({
      ...prev,
      messages: [
        toLegacyDashboardMessage(
          buildDashboardAssistantMessage({
            idPrefix: 'proactive',
            payload: chatData,
          }),
        ),
      ],
    }));

    if (resolveDashboardPrimaryAction(chatData)?.status === 'success') {
      refreshPlanAfterAction(setState);
    }
  } catch (chatError) {
    techDebtLogger.error('[SofLIA Dashboard] Error obteniendo analisis proactivo:', chatError);
    setState(prev => ({
      ...prev,
      messages: [createDashboardWelcomeMessage(plan)],
    }));
  }
}

function refreshPlanAfterAction(
  setState: Dispatch<SetStateAction<StudyPlannerDashboardState>>,
) {
  setTimeout(() => {
    fetch('/api/study-planner/dashboard/plan')
      .then(res => res.json())
      .then(planData => {
        if (planData.success && planData.data) {
          setState(prev => ({ ...prev, activePlan: planData.data }));
        }
      })
      .catch(err => techDebtLogger.error('Error recargando plan:', err));
  }, 500);
}
