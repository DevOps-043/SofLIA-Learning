import type {
  ActiveStudyPlan,
  DashboardMessage,
} from './useStudyPlannerDashboardLIA';

export const CALENDAR_CHECK_INTERVAL = 60 * 60 * 1000;

export function createNoPlanMessage(): DashboardMessage {
  return {
    id: `no-plan-${Date.now()}`,
    role: 'assistant',
    content: `Hola, soy SofLIA, tu asistente de estudios.

Aun no tienes un plan de estudios activo. Te gustaria crear uno?

Puedo ayudarte a organizar tu tiempo de estudio segun tu disponibilidad y objetivos.

[Ir a crear un plan](/study-planner/create)`,
    timestamp: new Date(),
  };
}

export function createLoadingPlanMessage(): DashboardMessage {
  return {
    id: `loading-${Date.now()}`,
    role: 'assistant',
    content: 'Hola, soy SofLIA. Estoy analizando tu calendario y plan de estudios...',
    timestamp: new Date(),
  };
}

export function createDashboardWelcomeMessage(plan: ActiveStudyPlan): DashboardMessage {
  return {
    id: `welcome-${Date.now()}`,
    role: 'assistant',
    content: `Hola, soy SofLIA, tu asistente para gestionar tu plan de estudios "${plan.name}".

Puedo ayudarte a:
- Mover sesiones a horarios mas convenientes.
- Ajustar la duracion de tus bloques de estudio.
- Eliminar sesiones que ya no necesites.
- Crear nuevas sesiones de estudio.
- Reorganizar tu semana segun tu disponibilidad.

En que te puedo ayudar hoy?`,
    timestamp: new Date(),
  };
}
