/**
 * useStudyPlannerDashboardLIA Hook
 *
 * Orchestrator hook for the LIA chat in the study-planner dashboard.
 * Delegates data-fetching to useDashboardLIAData and
 * message/action logic to useDashboardLIAAnalysis.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useDashboardLIAData } from './useDashboardLIAData';
import { useDashboardLIAAnalysis } from './useDashboardLIAAnalysis';

// Tipos para mensajes del chat
export interface DashboardMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actionType?: StudyPlannerAction;
  actionData?: Record<string, unknown>;
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
  executeAction: (action: StudyPlannerAction, data: Record<string, unknown>) => Promise<void>;
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

/**
 * Hook para manejar la interacción con LIA en el dashboard del planificador
 */
export function useStudyPlannerDashboardLIA(): StudyPlannerDashboardState & StudyPlannerDashboardActions {
  const { user } = useAuth();
  const [state, setState] = useState<StudyPlannerDashboardState>(initialState);

  // Stable ref so sub-hooks can read the latest state without stale closures
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const getState = useCallback(() => stateRef.current, []);
  const getMessagesLength = useCallback(() => stateRef.current.messages.length, []);

  // ── Data fetching sub-hook ─────────────────────────────────────────────────
  const {
    loadActivePlan,
    checkCalendarChanges,
    checkCalendarChangesIfNeeded,
    hasCheckedCalendarRef,
  } = useDashboardLIAData({
    userId: user?.id,
    setState,
    getMessagesLength,
  });

  // ── Analysis / messaging sub-hook ─────────────────────────────────────────
  const {
    sendMessage,
    executeAction,
    clearMessages,
    clearError,
    dismissCalendarChanges,
    abortControllerRef,
  } = useDashboardLIAAnalysis({
    userId: user?.id,
    getState,
    setState,
    loadActivePlan,
  });

  // Cargar plan activo al iniciar
  useEffect(() => {
    if (user) {
      loadActivePlan();
    }
  }, [user]);

  // Verificar cambios en calendario automáticamente al cargar el plan
  useEffect(() => {
    if (user && state.activePlan && !hasCheckedCalendarRef.current) {
      checkCalendarChanges();
      hasCheckedCalendarRef.current = true;
    }
  }, [user, state.activePlan]);

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
