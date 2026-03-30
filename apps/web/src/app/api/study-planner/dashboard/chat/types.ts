/**
 * Shared types for the Study Planner Dashboard Chat API
 */

// Tipos de acciones disponibles
export type ActionType =
  | 'move_session'
  | 'delete_session'
  | 'resize_session'
  | 'create_session'
  | 'update_session'
  | 'reschedule_sessions'
  | 'get_plan_summary'
  // Acciones de calendario externo
  | 'list_calendar_events'
  | 'create_calendar_event'
  | 'move_calendar_event'
  | 'delete_calendar_event'
  // Acciones proactivas de optimización
  | 'rebalance_plan'        // Redistribuir sesiones cuando el plan está atrasado
  | 'create_micro_session'  // Crear sesión corta de 15-30 min para ventanas libres
  | 'reduce_session_load'   // Reducir carga de días sobrecargados
  | 'recover_missed_session' // Reprogramar una sesión perdida
  // Configuración de calendarios
  | 'update_calendar_selection' // Cambiar qué calendarios considerar para disponibilidad
  // Alias que LIA a veces envía
  | 'rebalance'
  | 'rebalanzar'
  | 'redistribuir'
  | 'none';

export interface ActionResult {
  type: ActionType;
  data?: any;
  status: 'success' | 'error' | 'pending' | 'confirmation_needed';
  message?: string;
}

export interface ChatRequest {
  message?: string; // Opcional para triggers proactivos
  conversationHistory?: Array<{ role: string; content: string }>;
  activePlanId?: string;
  trigger?: 'user_message' | 'proactive_init';
}

export interface ChatResponse {
  success: boolean;
  response: string;
  action?: ActionResult;
  error?: string;
}

export interface SyncResult {
  deletedFromDb: string[];
  orphanedSessions: string[];
  message: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  isAllDay: boolean;
  isStudySession: boolean;
}

export interface ProactiveAnalysis {
  conflicts: Array<{
    sessionTitle: string;
    sessionId: string;
    sessionDate: string; // Fecha de la sesión (ej: "miércoles 17 de diciembre de 2025")
    sessionTime: string; // Solo hora (ej: "19:20 - 20:40")
    conflictingEvent: string;
    conflictTime: string;
    suggestedAlternatives: string[];
  }>;
  overloadedDays: Array<{
    date: string;
    totalHours: number;
    events: string[];
    suggestion: string;
  }>;
  missedSessions: Array<{
    sessionTitle: string;
    sessionId: string;
    originalTime: string;
    suggestedRecoverySlots: string[];
  }>;
  overdueSessions: Array<{
    sessionTitle: string;
    sessionId: string;
    scheduledTime: string;
    hoursOverdue: number;
    suggestedRecoverySlots: string[];
  }>;
  freeSlots: Array<{
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    suggestion: string;
  }>;
  weeklyProgress: {
    plannedMinutes: number;
    completedMinutes: number;
    remainingMinutes: number;
    onTrack: boolean;
    suggestion: string;
  };
  consistencyAlert: {
    daysWithoutStudy: number;
    lastStudyDate: string | null;
    suggestion: string;
  } | null;
  burnoutRisk: {
    level: 'low' | 'medium' | 'high';
    consecutiveHeavyDays: number;
    suggestion: string;
  } | null;
  patterns: {
    frequentRescheduleTime: string | null;
    preferredStudyTime: string | null;
    suggestion: string | null;
  };
}
