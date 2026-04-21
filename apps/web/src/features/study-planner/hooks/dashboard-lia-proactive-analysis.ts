import type { Dispatch, SetStateAction } from 'react';
import type {
  ActiveStudyPlan,
  DashboardMessage,
  StudyPlannerDashboardState,
} from './useStudyPlannerDashboardLIA';
import { createDashboardWelcomeMessage } from './dashboard-lia-initial-messages';

interface DashboardChatResponse {
  action?: {
    data?: Record<string, unknown>;
    status?: 'pending' | 'success' | 'error' | 'confirmation_needed';
    type?: DashboardMessage['actionType'];
  };
  error?: string;
  response?: string;
  success?: boolean;
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
    const chatData = await response.json() as DashboardChatResponse;

    if (!chatData.success || !chatData.response) {
      console.warn('[SofLIA Dashboard] Respuesta sin exito:', chatData.error || 'Sin respuesta');
      throw new Error(chatData.error || 'Sin respuesta del analisis');
    }

    setState(prev => ({
      ...prev,
      messages: [{
        id: `proactive-${Date.now()}`,
        role: 'assistant',
        content: chatData.response || '',
        timestamp: new Date(),
        actionType: chatData.action?.type,
        actionData: chatData.action?.data,
        actionStatus: chatData.action?.status,
      }],
    }));

    if (chatData.action?.status === 'success') {
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
