/**
 * useStudyPlannerSofLIA Hook
 * 
 * Hook personalizado para manejar el estado conversacional con SofLIA
 * en el planificador de estudios.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  UserContext,
  StudyPlanConfig,
  StudySession,
  TimeBlock,
  CalendarEvent,
  SofLIAAvailabilityAnalysis,
} from '../types/user-context.types';
import { generateStudyPlannerPrompt } from '../prompts/study-planner.prompt';

// Fases del flujo conversacional
export enum StudyPlannerPhase {
  WELCOME = 0,
  CONTEXT_ANALYSIS = 1,
  COURSE_SELECTION = 2,
  CALENDAR_INTEGRATION = 3,
  TIME_CONFIGURATION = 4,
  BREAK_CONFIGURATION = 5,
  SCHEDULE_CONFIGURATION = 6,
  SUMMARY = 7,
  COMPLETE = 8,
}

// Datos recopilados en cada fase
export interface PhaseData {
  // Fase 1: Análisis de contexto
  userContext?: UserContext;
  availabilityAnalysis?: SofLIAAvailabilityAnalysis;

  // Fase 2: Selección de cursos
  selectedCourseIds?: string[];
  learningRouteId?: string;

  // Fase 3: Calendario
  calendarConnected?: boolean;
  calendarProvider?: 'google' | 'microsoft';
  calendarEvents?: CalendarEvent[];

  // Fase 4: Tiempos de sesión
  minSessionMinutes?: number;
  maxSessionMinutes?: number;

  // Fase 5: Descansos
  breakDurationMinutes?: number;

  // Fase 6: Días y horarios
  preferredDays?: number[];
  preferredTimeBlocks?: TimeBlock[];
  preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';

  // Fase 7: Plan generado
  planName?: string;
  planDescription?: string;
  goalHoursPerWeek?: number;
  startDate?: string;
  endDate?: string;
  generatedSessions?: StudySession[];
}

// Mensaje en el historial
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  phase?: StudyPlannerPhase;
}

// Estado del hook
export interface StudyPlannerSofLIAState {
  currentPhase: StudyPlannerPhase;
  phaseData: PhaseData;
  messages: Message[];
  isLoading: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  error: string | null;
}

// Acciones disponibles
export interface StudyPlannerSofLIAActions {
  // Comunicación con SofLIA
  sendMessage: (message: string) => Promise<void>;
  sendVoiceMessage: (transcript: string) => Promise<void>;

  // Navegación entre fases
  goToPhase: (phase: StudyPlannerPhase) => void;
  nextPhase: () => void;
  previousPhase: () => void;

  // Actualización de datos
  updatePhaseData: (data: Partial<PhaseData>) => void;

  // Control de audio
  setIsListening: (listening: boolean) => void;
  setIsSpeaking: (speaking: boolean) => void;

  // Generación del plan
  generatePlan: () => Promise<void>;
  savePlan: () => Promise<{ planId: string; sessionIds: string[] } | null>;

  // Utilidades
  clearError: () => void;
  reset: () => void;
}

const initialState: StudyPlannerSofLIAState = {
  currentPhase: StudyPlannerPhase.WELCOME,
  phaseData: {},
  messages: [],
  isLoading: false,
  isListening: false,
  isSpeaking: false,
  error: null,
};

/**
 * Hook para manejar la interacción con SofLIA en el planificador de estudios
 */
export function useStudyPlannerSofLIA(): StudyPlannerSofLIAState & StudyPlannerSofLIAActions {
  const [state, setState] = useState<StudyPlannerSofLIAState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cargar contexto del usuario
  const loadUserContext = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch('/api/study-planner/user-context');

      if (!response.ok) {
        throw new Error('Error al cargar el contexto del usuario');
      }

      const data = await response.json();

      if (data.success && data.data) {
        setState(prev => ({
          ...prev,
          phaseData: {
            ...prev.phaseData,
            userContext: data.data,
            selectedCourseIds: data.data.courses.map((c: any) => c.courseId),
            calendarConnected: data.data.calendarIntegration?.isConnected,
            calendarProvider: data.data.calendarIntegration?.provider,
          },
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Error cargando contexto:', error);
      setState(prev => ({
        ...prev,
        error: 'Error al cargar tu información. Por favor, recarga la página.',
        isLoading: false,
      }));
    }
  }, []);

  // Cargar contexto del usuario al iniciar
  useEffect(() => {
    loadUserContext();
  }, [loadUserContext]);

  // Enviar mensaje a SofLIA
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    // Cancelar solicitud anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      phase: state.currentPhase,
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      // Preparar historial de conversación
      const conversationHistory = state.messages
        .slice(-10) // Últimos 10 mensajes
        .map(m => ({
          role: m.role,
          content: m.content,
        }));
        
      const hookDateStr = new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const hookSystemPrompt = generateStudyPlannerPrompt({
        userName: undefined,
        studyPlannerContextString: `FASE ACTUAL: ${StudyPlannerPhase[state.currentPhase]}\nCURSOS SELECCIONADOS: ${state.phaseData.selectedCourseIds?.length || 0}`,
        currentDate: hookDateStr
      });

      const response = await fetch('/api/study-planner-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationHistory,
          systemPrompt: hookSystemPrompt,
          userName: undefined
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Error al comunicarse con SofLIA');
      }

      const data = await response.json();

      // Agregar respuesta de SofLIA
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        phase: state.currentPhase,
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
      }));

      return data.response;

    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }

      console.error('Error enviando mensaje:', error);
      setState(prev => ({
        ...prev,
        error: 'Error al comunicarse con SofLIA. Por favor, intenta de nuevo.',
        isLoading: false,
      }));
    }
  }, [state.currentPhase, state.messages, state.phaseData]);

  // Enviar mensaje por voz
  const sendVoiceMessage = useCallback(async (transcript: string) => {
    setState(prev => ({ ...prev, isListening: false }));
    return sendMessage(transcript);
  }, [sendMessage]);

  // Ir a una fase específica
  const goToPhase = useCallback((phase: StudyPlannerPhase) => {
    setState(prev => ({
      ...prev,
      currentPhase: phase,
    }));
  }, []);

  // Avanzar a la siguiente fase
  const nextPhase = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentPhase: Math.min(prev.currentPhase + 1, StudyPlannerPhase.COMPLETE),
    }));
  }, []);

  // Retroceder a la fase anterior
  const previousPhase = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentPhase: Math.max(prev.currentPhase - 1, StudyPlannerPhase.WELCOME),
    }));
  }, []);

  // Actualizar datos de la fase
  const updatePhaseData = useCallback((data: Partial<PhaseData>) => {
    setState(prev => ({
      ...prev,
      phaseData: {
        ...prev.phaseData,
        ...data,
      },
    }));
  }, []);

  // Control de escucha
  const setIsListening = useCallback((listening: boolean) => {
    setState(prev => ({ ...prev, isListening: listening }));
  }, []);

  // Control de habla
  const setIsSpeaking = useCallback((speaking: boolean) => {
    setState(prev => ({ ...prev, isSpeaking: speaking }));
  }, []);

  // Generar plan
  const generatePlan = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { phaseData } = state;

      if (!phaseData.selectedCourseIds || phaseData.selectedCourseIds.length === 0) {
        throw new Error('No hay cursos seleccionados');
      }

      if (!phaseData.minSessionMinutes || !phaseData.maxSessionMinutes) {
        throw new Error('No se han configurado los tiempos de sesión');
      }

      const requestBody = {
        name: phaseData.planName || 'Mi Plan de Estudios',
        description: phaseData.planDescription,
        courseIds: phaseData.selectedCourseIds,
        learningRouteId: phaseData.learningRouteId,
        goalHoursPerWeek: phaseData.goalHoursPerWeek || 5,
        startDate: phaseData.startDate || new Date().toISOString(),
        endDate: phaseData.endDate,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        preferredDays: phaseData.preferredDays || [1, 2, 3, 4, 5],
        preferredTimeBlocks: phaseData.preferredTimeBlocks || [],
        minSessionMinutes: phaseData.minSessionMinutes,
        maxSessionMinutes: phaseData.maxSessionMinutes,
        breakDurationMinutes: phaseData.breakDurationMinutes || 10,
        preferredSessionType: getSessionType(phaseData.maxSessionMinutes),
      };

      const response = await fetch('/api/study-planner/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Error al generar el plan');
      }

      const data = await response.json();

      if (data.success && data.data) {
        setState(prev => ({
          ...prev,
          phaseData: {
            ...prev.phaseData,
            generatedSessions: data.data.sessions,
          },
          isLoading: false,
        }));
      }

    } catch (error) {
      console.error('Error generando plan:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al generar el plan',
        isLoading: false,
      }));
    }
  }, [state.phaseData]);

  // Guardar plan
  const savePlan = useCallback(async (): Promise<{ planId: string; sessionIds: string[] } | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { phaseData } = state;

      if (!phaseData.generatedSessions || phaseData.generatedSessions.length === 0) {
        throw new Error('No hay sesiones generadas para guardar');
      }

      const config: StudyPlanConfig = {
        name: phaseData.planName || 'Mi Plan de Estudios',
        description: phaseData.planDescription,
        userType: phaseData.userContext?.userType || 'b2c',
        courseIds: phaseData.selectedCourseIds || [],
        learningRouteId: phaseData.learningRouteId,
        goalHoursPerWeek: phaseData.goalHoursPerWeek || 5,
        startDate: phaseData.startDate,
        endDate: phaseData.endDate,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        preferredDays: phaseData.preferredDays || [1, 2, 3, 4, 5],
        preferredTimeBlocks: phaseData.preferredTimeBlocks || [],
        minSessionMinutes: phaseData.minSessionMinutes || 20,
        maxSessionMinutes: phaseData.maxSessionMinutes || 45,
        breakDurationMinutes: phaseData.breakDurationMinutes || 10,
        preferredSessionType: getSessionType(phaseData.maxSessionMinutes || 45),
        generationMode: 'ai_generated',
        sofLiaAvailabilityAnalysis: phaseData.availabilityAnalysis,
        calendarAnalyzed: phaseData.calendarConnected || false,
        calendarProvider: phaseData.calendarProvider,
      };

      const response = await fetch('/api/study-planner/save-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          sessions: phaseData.generatedSessions,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el plan');
      }

      const data = await response.json();

      if (data.success && data.data) {
        setState(prev => ({
          ...prev,
          currentPhase: StudyPlannerPhase.COMPLETE,
          isLoading: false,
        }));

        return {
          planId: data.data.planId,
          sessionIds: data.data.sessionIds || []
        };
      }

      return null;

    } catch (error) {
      console.error('Error guardando plan:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al guardar el plan',
        isLoading: false,
      }));
      return null;
    }
  }, [state.phaseData]);

  // Limpiar error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Reiniciar estado
  const reset = useCallback(() => {
    setState(initialState);
    loadUserContext();
  }, [loadUserContext]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    sendMessage,
    sendVoiceMessage,
    goToPhase,
    nextPhase,
    previousPhase,
    updatePhaseData,
    setIsListening,
    setIsSpeaking,
    generatePlan,
    savePlan,
    clearError,
    reset,
  };
}

function getSessionType(maxMinutes: number): 'short' | 'medium' | 'long' {
  if (maxMinutes <= 25) return 'short';
  if (maxMinutes <= 45) return 'medium';
  return 'long';
}

export default useStudyPlannerSofLIA;
