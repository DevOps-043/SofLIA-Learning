import type { Dispatch, SetStateAction } from 'react';
import type {
  ActiveStudyPlan,
  StudyPlannerDashboardState,
} from './useStudyPlannerDashboardLIA';
import {
  buildDashboardAssistantMessage,
  resolveDashboardPrimaryAction,
} from './dashboard-soflia-chat-response.service';
import { createDashboardWelcomeMessage } from './dashboard-lia-initial-messages';
import type { DashboardChatSuccessPayload } from './useDashboardSofLIAState.types';

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
      console.warn('[SofLIA Dashboard] Respuesta sin exito:', chatData.error || 'Sin respuesta');
      throw new Error(chatData.error || 'Sin respuesta del analisis');
    }

    setState(prev => ({
      ...prev,
      messages: [
        buildDashboardAssistantMessage({
          idPrefix: 'proactive',
          payload: chatData,
        }),
      ],
    }));

    if (resolveDashboardPrimaryAction(chatData)?.status === 'success') {
      refreshPlanAfterAction(setState);
    }
  } catch (chatError) {
    console.error('[SofLIA Dashboard] Error obteniendo analisis proactivo:', chatError);
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
      .catch(err => console.error('Error recargando plan:', err));
  }, 500);
}
