/**
 * useStudyPlannerDashboardLIA Hook
 * 
 * Hook para manejar el chat con LIA en el dashboard del planificador de estudios.
 * Permite gestionar el plan de estudios a través de conversaciones con LIA:
 * - Mover sesiones de estudio
 * - Eliminar bloques de estudio
 * - Ampliar o reducir sesiones
 * - Crear nuevas sesiones
 * - Detectar cambios en el calendario
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';

// Tipos para mensajes del chat
export interface DashboardMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actionType?: StudyPlannerAction;
  actionData?: any;
  actionStatus?: 'pending' | 'success' | 'error';
}

// Tipos de acciones que LIA puede ejecutar
export type StudyPlannerAction =
  | 'move_session'
  | 'delete_session'
  | 'resize_session'
  | 'create_session'
  | 'update_session'
  | 'reschedule_week'
  | 'analyze_calendar'
  | 'suggest_adjustments'
  | 'get_plan_summary';

// Datos de una sesión de estudio
export interface StudySession {
  id: string;
  planId: string;
  title: string;
  description?: string;
  courseId?: string;
  lessonId?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: 'planned' | 'in_progress' | 'completed' | 'missed' | 'rescheduled';
  isAiGenerated: boolean;
}

// Plan de estudio activo
export interface ActiveStudyPlan {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  timezone: string;
  sessions: StudySession[];
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
}

// Cambios detectados en el calendario
export interface CalendarChange {
  type: 'new_event' | 'modified_event' | 'deleted_event' | 'conflict';
  sessionId: string;
  sessionTitle: string;
  eventTitle?: string; // Mantener para compatibilidad
  eventTime: string;
  externalEventId: string;
  affectedSessions?: string[];
  suggestedAction?: string;
}

// Estado del hook
export interface StudyPlannerDashboardState {
  messages: DashboardMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  activePlan: ActiveStudyPlan | null;
  calendarChanges: CalendarChange[];
  lastCalendarCheck: Date | null;
  hasNewCalendarChanges: boolean;
}

// Acciones disponibles
export interface StudyPlannerDashboardActions {
  sendMessage: (message: string) => Promise<void>;
  executeAction: (action: StudyPlannerAction, data: any) => Promise<void>;
  checkCalendarChanges: () => Promise<void>;
  loadActivePlan: () => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
  dismissCalendarChanges: () => void;
}

const initialState: StudyPlannerDashboardState = {
  messages: [],
  isLoading: true,
  isSending: false,
  error: null,
  activePlan: null,
  calendarChanges: [],
  lastCalendarCheck: null,
  hasNewCalendarChanges: false,
};

// Constante para el check de calendario (verificar cada vez, pero no más de cada hora)
const CALENDAR_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hora

/**
 * Hook para manejar la interacción con LIA en el dashboard del planificador
 */
export function useStudyPlannerDashboardLIA(): StudyPlannerDashboardState & StudyPlannerDashboardActions {
  const { user } = useAuth();
  const [state, setState] = useState<StudyPlannerDashboardState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasCheckedCalendarRef = useRef(false);

  // Cargar plan activo al iniciar
  useEffect(() => {
    if (user) {
      loadActivePlan();
    }
  }, [user]);

  // Verificar cambios en calendario automáticamente al cargar el plan
  useEffect(() => {
    if (user && state.activePlan && !hasCheckedCalendarRef.current) {
      // Verificar cambios inmediatamente al cargar
      checkCalendarChanges();
      hasCheckedCalendarRef.current = true;
    }
  }, [user, state.activePlan]);

  // Cargar plan de estudio activo
  const loadActivePlan = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/study-planner/dashboard/plan');
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          // No hay plan activo - mostrar mensaje invitando a crear uno
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
        // Otro error del servidor
        console.error('Error del servidor:', data.error || response.statusText);
        throw new Error(data.error || 'Error al cargar el plan de estudios');
      }

      if (data.success && data.data) {
        const plan = data.data;
        const isFirstLoad = state.messages.length === 0;
        
        setState(prev => ({
          ...prev,
          activePlan: plan,
          isLoading: false,
          // Mostrar mensaje de carga mientras se obtiene el análisis proactivo
          messages: prev.messages.length === 0 ? [{
            id: `loading-${Date.now()}`,
            role: 'assistant' as const,
            content: `¡Hola! Soy SofLIA. Estoy analizando tu calendario y plan de estudios...`,
            timestamp: new Date(),
          }] : prev.messages,
        }));
        
        // Si es la primera carga, hacer una llamada proactiva a SofLIA para obtener análisis
        if (isFirstLoad) {
          // Obtener análisis proactivo de SofLIA
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
            
            const chatData = await chatResponse.json();
            
            if (chatData.success && chatData.response) {
              setState(prev => ({
                ...prev,
                messages: [{
                  id: `proactive-${Date.now()}`,
                  role: 'assistant' as const,
                  content: chatData.response,
                  timestamp: new Date(),
                  // Incluir información de la acción si existe
                  actionType: chatData.action?.type,
                  actionData: chatData.action?.data,
                  actionStatus: chatData.action?.status,
                }],
              }));
              
              // Si la acción fue exitosa, recargar el plan para reflejar los cambios
              if (chatData.action?.status === 'success') {
                // Recargar después de un breve delay para que la BD se actualice
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
            } else {
              // API respondió pero sin éxito o sin respuesta - mostrar fallback
              console.warn('[SofLIA Dashboard] Respuesta sin éxito:', chatData.error || 'Sin respuesta');
              throw new Error(chatData.error || 'Sin respuesta del análisis');
            }
          } catch (chatError) {
            console.error('[SofLIA Dashboard] Error obteniendo análisis proactivo:', chatError);
            // Fallback al mensaje estático si falla
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
        // Respuesta sin datos válidos
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
  }, [user]);

  // Verificar cambios en calendario si es necesario
  const checkCalendarChangesIfNeeded = useCallback(async () => {
    if (!user) return;

    try {
      // Obtener última fecha de verificación del localStorage
      const lastCheckStr = localStorage.getItem(`calendar_check_${user.id}`);
      const lastCheck = lastCheckStr ? new Date(lastCheckStr) : null;
      const now = new Date();

      // Si ya se verificó hoy, no verificar de nuevo
      if (lastCheck && (now.getTime() - lastCheck.getTime()) < CALENDAR_CHECK_INTERVAL) {
        setState(prev => ({ ...prev, lastCalendarCheck: lastCheck }));
        return;
      }

      // Verificar cambios
      await checkCalendarChanges();
    } catch (error) {
      console.error('Error verificando calendario:', error);
    }
  }, [user]);

  // Verificar cambios en el calendario
  const checkCalendarChanges = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/study-planner/calendar/check-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Error al verificar calendario');
      }

      const data = await response.json();
      const now = new Date();

      // Guardar fecha de verificación
      localStorage.setItem(`calendar_check_${user.id}`, now.toISOString());

      if (data.success && data.data) {
        const changes = data.data.changes || [];
        
        if (changes.length > 0) {
          // Hay cambios detectados - actualizar estado primero
          setState(prev => ({
            ...prev,
            calendarChanges: changes,
            lastCalendarCheck: now,
            hasNewCalendarChanges: true,
          }));

          // Recargar el plan para reflejar actualizaciones en BD (sesiones marcadas como eliminadas)
          // Usar la función loadActivePlan directamente en lugar de await dentro del callback
          // porque loadActivePlan ya actualiza el estado
          loadActivePlan().catch(err => console.error('Error recargando plan después de cambios:', err));

          // Agregar mensaje proactivo de LIA sobre los cambios SOLO si no existe ya uno similar
          // (evitar duplicados si se ejecuta múltiples veces)
          const changeMessage: DashboardMessage = {
            id: `calendar-changes-${Date.now()}`,
            role: 'assistant',
            content: formatCalendarChangesMessage(changes),
            timestamp: now,
          };

          setState(prev => {
            // Verificar si ya hay un mensaje de cambios reciente (últimos 5 minutos)
            const recentChangeMessage = prev.messages.find(m => 
              m.role === 'assistant' && 
              m.content.includes('cambios importantes en tu calendario') &&
              (now.getTime() - m.timestamp.getTime()) < 5 * 60 * 1000
            );
            
            // Solo agregar si no hay uno reciente
            if (recentChangeMessage) {
              return prev;
            }
            
            return {
              ...prev,
              messages: [...prev.messages, changeMessage],
            };
          });
        } else {
          // No hay cambios
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
  }, [user, loadActivePlan]);

  // Formatear mensaje de cambios en calendario
  const formatCalendarChangesMessage = (changes: CalendarChange[]): string => {
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
  };

  // Enviar mensaje a LIA
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || state.isSending) return;

    // Cancelar solicitud anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Agregar mensaje del usuario
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
      // Preparar historial de conversación
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
        throw new Error('Error al comunicarse con LIA');
      }

      const data = await response.json();

      // Agregar respuesta de LIA
      const assistantMessage: DashboardMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        actionType: data.action?.type,
        actionData: data.action?.data,
        actionStatus: data.action?.status,
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isSending: false,
      }));

      // Si hay una acción ejecutada, actualizar el plan
      if (data.action?.status === 'success') {
        await loadActivePlan();
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;

      console.error('Error enviando mensaje:', error);
      setState(prev => ({
        ...prev,
        error: 'Error al comunicarse con LIA. Por favor, intenta de nuevo.',
        isSending: false,
      }));
    }
  }, [state.messages, state.activePlan, state.isSending, loadActivePlan]);

  // Ejecutar una acción específica
  const executeAction = useCallback(async (action: StudyPlannerAction, data: any) => {
    if (!user || !state.activePlan) return;

    setState(prev => ({ ...prev, isSending: true }));

    try {
      const response = await fetch('/api/study-planner/dashboard/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          data,
          planId: state.activePlan.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al ejecutar acción');
      }

      const result = await response.json();

      if (result.success) {
        // Actualizar plan después de la acción
        await loadActivePlan();

        // Agregar mensaje de confirmación
        const confirmMessage: DashboardMessage = {
          id: `action-${Date.now()}`,
          role: 'assistant',
          content: result.message || '✅ Acción completada correctamente.',
          timestamp: new Date(),
          actionType: action,
          actionStatus: 'success',
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, confirmMessage],
          isSending: false,
        }));
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error ejecutando acción:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al ejecutar la acción',
        isSending: false,
      }));
    }
  }, [user, state.activePlan, loadActivePlan]);

  // Limpiar mensajes
  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, messages: [] }));
  }, []);

  // Limpiar error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Descartar cambios de calendario
  const dismissCalendarChanges = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasNewCalendarChanges: false,
      calendarChanges: [],
    }));
  }, []);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // Estado
    ...state,

    // Acciones
    sendMessage,
    executeAction,
    checkCalendarChanges,
    loadActivePlan,
    clearMessages,
    clearError,
    dismissCalendarChanges,
  };
}

export default useStudyPlannerDashboardLIA;
