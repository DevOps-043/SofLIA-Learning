import { logger as techDebtLogger } from '@/lib/utils/logger'
import type { Dispatch, SetStateAction } from 'react';
import type {
  ActiveStudyPlan,
  DashboardMessage,
  StudyPlannerDashboardState,
} from './useStudyPlannerDashboardSofLIA';
import {
  buildDashboardAssistantMessage,
  resolveDashboardPrimaryAction,
} from './dashboard-soflia-chat-response.service';
import { refreshSofLIAPlanAfterAction } from './dashboard-soflia-plan-refresh';
import type { DashboardChatSuccessPayload } from './useDashboardSofLIAState.types';

export function createSofLIANoPlanMessage(): DashboardMessage {
  return {
    id: `no-plan-${Date.now()}`,
    role: 'assistant',
    content: `Hola, soy SofLIA, tu asistente de estudios.

Aun no tienes un plan de estudios activo. Te gustaria crear uno?

Puedo ayudarte a organizar tu tiempo segun tu disponibilidad y objetivos.

[Ir a crear un plan](/study-planner/create)`,
    timestamp: new Date(),
  };
}

export function createSofLIALoadingMessage(): DashboardMessage {
  return {
    id: `loading-${Date.now()}`,
    role: 'assistant',
    content: 'Hola, soy SofLIA. Estoy analizando tu calendario y plan de estudios...',
    timestamp: new Date(),
  };
}

export function createSofLIAWelcomeMessage(plan: ActiveStudyPlan): DashboardMessage {
  return {
    id: `welcome-${Date.now()}`,
    role: 'assistant',
    content: `Hola, soy SofLIA, tu asistente para gestionar tu plan "${plan.name}".

Puedo ayudarte a mover sesiones, ajustar duraciones, eliminar bloques, crear nuevas sesiones y reorganizar tu semana.

En que te puedo ayudar hoy?`,
    timestamp: new Date(),
  };
}

export async function loadSofLIAProactiveAnalysis({
  plan,
  planQuery,
  setState,
}: {
  plan: ActiveStudyPlan;
  planQuery: string;
  setState: Dispatch<SetStateAction<StudyPlannerDashboardState>>;
}) {
  try {
    const chatResponse = await fetch('/api/study-planner/dashboard/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trigger: 'proactive_init',
        activePlanId: plan.id,
        conversationHistory: [],
      }),
    });

    if (!chatResponse.ok) {
      const chatError = await chatResponse.json().catch(() => null as { error?: string } | null);
      throw new Error(chatError?.error || 'No se pudo obtener el analisis proactivo');
    }

    const chatData = await chatResponse.json() as DashboardChatSuccessPayload;
    if (!chatData.success || !chatData.response) {
      techDebtLogger.warn('[SofLIA Dashboard] Respuesta sin exito:', chatData.error || 'Sin respuesta');
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
      refreshSofLIAPlanAfterAction(planQuery, setState);
    }
  } catch (chatError) {
    techDebtLogger.error('[SofLIA Dashboard] Error obteniendo analisis proactivo:', chatError);
    setState(prev => ({
      ...prev,
      messages: [createSofLIAWelcomeMessage(plan)],
    }));
  }
}
