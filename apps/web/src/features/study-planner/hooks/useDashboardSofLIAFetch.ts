/**
 * useDashboardSofLIAFetch
 *
 * Sub-hook extracted from useStudyPlannerDashboardSofLIA.
 * Handles data fetching: loading the active plan and checking calendar changes.
 */

import { useCallback, useRef } from 'react';
import type {
  ActiveStudyPlan,
  CalendarChange,
  DashboardMessage,
  StudyPlannerDashboardState,
} from './useStudyPlannerDashboardSofLIA';

function formatCalendarChangesMessage(changes: CalendarChange[]): string {
  const deletedEvents = changes.filter(c => c.type === 'deleted_event');
  const modifiedEvents = changes.filter(c => c.type === 'modified_event');
  const conflicts = changes.filter(c => c.type === 'conflict');

  let message = '🔔 **He detectado cambios importantes en tu calendario:**\n\n';

  if (deletedEvents.length > 0) {
    message += '❌ **Sesiones eliminadas del calendario:**\n';
    deletedEvents.forEach(c => {
      message += `• "${c.sessionTitle}" (${c.eventTime})\n`;
    });
    message += '\n';
    message += 'Estas sesiones ya no aparecen en tu calendario pero siguen en tu plan. ¿Quieres que las elimine del plan también?\n\n';
  }

  if (modifiedEvents.length > 0) {
    message += '🔄 **Sesiones modificadas en el calendario:**\n';
    modifiedEvents.forEach(c => {
      message += `• "${c.sessionTitle}" - ${c.suggestedAction || 'Hora cambiada'}\n`;
    });
    message += '\n';
    message += '¿Quieres que actualice los horarios en tu plan para que coincidan?\n\n';
  }

  if (conflicts.length > 0) {
    message += '⚠️ **Conflictos encontrados:**\n';
    conflicts.forEach(c => {
      message += `• ${c.eventTitle} (${c.eventTime}) - ${c.suggestedAction}\n`;
    });
    message += '\n';
  }

  if (deletedEvents.length === 0 && modifiedEvents.length === 0 && conflicts.length === 0) {
    message = '✅ Todo está sincronizado. No he detectado cambios en tu calendario.';
  } else {
    message += 'Dime cómo quieres proceder y te ayudo a actualizar tu plan.';
  }

  return message;
}

interface UseDashboardSofLIAFetchParams {
  userId: string | undefined;
  selectedPlanId?: string | null;
  setState: React.Dispatch<React.SetStateAction<StudyPlannerDashboardState>>;
  getMessagesLength: () => number;
}

interface UseDashboardSofLIAFetchReturn {
  loadActivePlan: () => Promise<void>;
  checkCalendarChanges: () => Promise<void>;
  hasCheckedCalendarRef: React.MutableRefObject<boolean>;
}

export function useDashboardSofLIAFetch({
  userId,
  selectedPlanId,
  setState,
  getMessagesLength,
}: UseDashboardSofLIAFetchParams): UseDashboardSofLIAFetchReturn {
  const hasCheckedCalendarRef = useRef(false);

  const loadActivePlan = useCallback(async () => {
    if (!userId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const query = selectedPlanId
        ? `?planId=${encodeURIComponent(selectedPlanId)}`
        : '';
      const response = await fetch(`/api/study-planner/dashboard/plan${query}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setState(prev => ({
            ...prev,
            activePlan: null,
            isLoading: false,
            messages: [{
              id: `no-plan-${Date.now()}`,
              role: 'assistant',
              content: `¡Hola! 👋 Soy SofLIA, tu asistente de estudios.

Aún no tienes un plan de estudios activo. ¿Te gustaría crear uno?

Puedo ayudarte a organizar tu tiempo de estudio de manera eficiente según tu disponibilidad y objetivos.

[Ir a crear un plan](/study-planner/create)`,
              timestamp: new Date(),
            }],
          }));
          return;
        }
        console.error('Error del servidor:', data.error || response.statusText);
        throw new Error(data.error || 'Error al cargar el plan de estudios');
      }

      if (data.success && data.data) {
        const plan: ActiveStudyPlan = data.data;
        const isFirstLoad = getMessagesLength() === 0;

        setState(prev => ({
          ...prev,
          activePlan: plan,
          isLoading: false,
          messages: prev.messages.length === 0 ? [{
            id: `loading-${Date.now()}`,
            role: 'assistant' as const,
            content: `¡Hola! Soy SofLIA. Estoy analizando tu calendario y plan de estudios...`,
            timestamp: new Date(),
          }] : prev.messages,
        }));

        if (isFirstLoad) {
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

            const chatData = await chatResponse.json();

            if (chatData.success && chatData.response) {
              setState(prev => ({
                ...prev,
                messages: [{
                  id: `proactive-${Date.now()}`,
                  role: 'assistant' as const,
                  content: chatData.response,
                  timestamp: new Date(),
                  actionType: chatData.action?.type,
                  actionData: chatData.action?.data,
                  actionStatus: chatData.action?.status,
                }],
              }));

              if (chatData.action?.status === 'success') {
                setTimeout(() => {
                  fetch(`/api/study-planner/dashboard/plan${query}`)
                    .then(res => res.json())
                    .then(planData => {
                      if (planData.success && planData.data) {
                        setState(prev => ({ ...prev, activePlan: planData.data }));
                      }
                    })
                    .catch(err => console.error('Error recargando plan:', err));
                }, 500);
              }
            } else {
              console.warn('[SofLIA Dashboard] Respuesta sin éxito:', chatData.error || 'Sin respuesta');
              throw new Error(chatData.error || 'Sin respuesta del análisis');
            }
          } catch (chatError) {
            console.error('[SofLIA Dashboard] Error obteniendo análisis proactivo:', chatError);
            setState(prev => ({
              ...prev,
              messages: [{
                id: `welcome-${Date.now()}`,
                role: 'assistant' as const,
                content: `¡Hola! 👋 Soy SofLIA, tu asistente para gestionar tu plan de estudios "${plan.name}".

Puedo ayudarte a:
• 📅 **Mover sesiones** a horarios más convenientes
• ⏱️ **Ajustar la duración** de tus bloques de estudio
• ❌ **Eliminar sesiones** que ya no necesites
• ➕ **Crear nuevas sesiones** de estudio
• 🔄 **Reorganizar tu semana** según tu disponibilidad

¿En qué te puedo ayudar hoy?`,
                timestamp: new Date(),
              }],
            }));
          }
        }
      } else {
        setState(prev => ({
          ...prev,
          activePlan: null,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Error cargando plan activo:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al cargar tu plan de estudios',
        isLoading: false,
      }));
    }
  }, [userId, selectedPlanId, setState, getMessagesLength]);

  const checkCalendarChanges = useCallback(async () => {
    if (!userId) return;

    try {
      const query = selectedPlanId
        ? `?planId=${encodeURIComponent(selectedPlanId)}`
        : '';
      const response = await fetch(`/api/study-planner/calendar/check-changes${query}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Error al verificar calendario');
      }

      const data = await response.json();
      const now = new Date();

      localStorage.setItem(`calendar_check_${userId}`, now.toISOString());

      if (data.success && data.data) {
        const changes: CalendarChange[] = data.data.changes || [];

        if (changes.length > 0) {
          setState(prev => ({
            ...prev,
            calendarChanges: changes,
            lastCalendarCheck: now,
            hasNewCalendarChanges: true,
          }));

          loadActivePlan().catch(err => console.error('Error recargando plan después de cambios:', err));

          const changeMessage: DashboardMessage = {
            id: `calendar-changes-${Date.now()}`,
            role: 'assistant',
            content: formatCalendarChangesMessage(changes),
            timestamp: now,
          };

          setState(prev => {
            const recentChangeMessage = prev.messages.find(m =>
              m.role === 'assistant' &&
              m.content.includes('cambios importantes en tu calendario') &&
              (now.getTime() - m.timestamp.getTime()) < 5 * 60 * 1000
            );

            if (recentChangeMessage) {
              return prev;
            }

            return {
              ...prev,
              messages: [...prev.messages, changeMessage],
            };
          });
        } else {
          setState(prev => ({
            ...prev,
            lastCalendarCheck: now,
            hasNewCalendarChanges: false,
            calendarChanges: [],
          }));
        }
      } else {
        setState(prev => ({
          ...prev,
          lastCalendarCheck: now,
          hasNewCalendarChanges: false,
        }));
      }
    } catch (error) {
      console.error('Error verificando calendario:', error);
    }
  }, [userId, setState, loadActivePlan]);

  return {
    loadActivePlan,
    checkCalendarChanges,
    hasCheckedCalendarRef,
  };
}
