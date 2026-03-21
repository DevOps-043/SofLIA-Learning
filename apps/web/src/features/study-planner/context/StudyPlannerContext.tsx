'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import type {
  UserContext,
  StudyPlanConfig,
  StudySession,
  TimeBlock,
  CalendarEvent,
  SofLIAAvailabilityAnalysis,
  SofLIATimeAnalysis,
} from '../types/user-context.types';

// ============================================================================
// TIPOS
// ============================================================================

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

export interface StudyPlannerState {
  // Estado de la aplicación
  currentPhase: StudyPlannerPhase;
  isLoading: boolean;
  error: string | null;
  
  // Contexto del usuario
  userContext: UserContext | null;
  
  // Datos del plan
  planName: string;
  planDescription: string;
  selectedCourseIds: string[];
  learningRouteId?: string;
  
  // Configuración de tiempos
  minSessionMinutes: number;
  maxSessionMinutes: number;
  breakDurationMinutes: number;
  goalHoursPerWeek: number;
  
  // Configuración de horarios
  preferredDays: number[];
  preferredTimeBlocks: TimeBlock[];
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  
  // Fechas
  startDate: string;
  endDate?: string;
  timezone: string;
  
  // Calendario
  calendarConnected: boolean;
  calendarProvider?: 'google' | 'microsoft';
  calendarEvents: CalendarEvent[];
  
  // Análisis de LIA
  liaAvailabilityAnalysis?: SofLIAAvailabilityAnalysis;
  liaTimeAnalysis?: SofLIATimeAnalysis;
  
  // Plan generado
  generatedConfig?: StudyPlanConfig;
  generatedSessions: StudySession[];
  
  // Plan guardado
  savedPlanId?: string;
}

type StudyPlannerAction =
  | { type: 'SET_PHASE'; payload: StudyPlannerPhase }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER_CONTEXT'; payload: UserContext }
  | { type: 'SET_PLAN_NAME'; payload: string }
  | { type: 'SET_PLAN_DESCRIPTION'; payload: string }
  | { type: 'SET_SELECTED_COURSES'; payload: string[] }
  | { type: 'SET_LEARNING_ROUTE'; payload: string | undefined }
  | { type: 'SET_SESSION_TIMES'; payload: { min: number; max: number } }
  | { type: 'SET_BREAK_DURATION'; payload: number }
  | { type: 'SET_GOAL_HOURS'; payload: number }
  | { type: 'SET_PREFERRED_DAYS'; payload: number[] }
  | { type: 'SET_TIME_BLOCKS'; payload: TimeBlock[] }
  | { type: 'SET_TIME_OF_DAY'; payload: 'morning' | 'afternoon' | 'evening' | 'night' }
  | { type: 'SET_START_DATE'; payload: string }
  | { type: 'SET_END_DATE'; payload: string | undefined }
  | { type: 'SET_CALENDAR_CONNECTED'; payload: { connected: boolean; provider?: 'google' | 'microsoft' } }
  | { type: 'SET_CALENDAR_EVENTS'; payload: CalendarEvent[] }
  | { type: 'SET_LIA_AVAILABILITY_ANALYSIS'; payload: SofLIAAvailabilityAnalysis }
  | { type: 'SET_LIA_TIME_ANALYSIS'; payload: SofLIATimeAnalysis }
  | { type: 'SET_GENERATED_PLAN'; payload: { config: StudyPlanConfig; sessions: StudySession[] } }
  | { type: 'SET_SAVED_PLAN_ID'; payload: string }
  | { type: 'RESET' };

// ============================================================================
// ESTADO INICIAL
// ============================================================================

const initialState: StudyPlannerState = {
  currentPhase: StudyPlannerPhase.WELCOME,
  isLoading: false,
  error: null,
  userContext: null,
  planName: 'Mi Plan de Estudios',
  planDescription: '',
  selectedCourseIds: [],
  minSessionMinutes: 25,
  maxSessionMinutes: 45,
  breakDurationMinutes: 10,
  goalHoursPerWeek: 5,
  preferredDays: [1, 2, 3, 4, 5], // Lunes a Viernes
  preferredTimeBlocks: [],
  preferredTimeOfDay: 'morning',
  startDate: new Date().toISOString().split('T')[0],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  calendarConnected: false,
  calendarEvents: [],
  generatedSessions: [],
};

// ============================================================================
// REDUCER
// ============================================================================

function studyPlannerReducer(state: StudyPlannerState, action: StudyPlannerAction): StudyPlannerState {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, currentPhase: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_USER_CONTEXT':
      return { 
        ...state, 
        userContext: action.payload,
        selectedCourseIds: action.payload.courses.map(c => c.courseId),
        calendarConnected: action.payload.calendarIntegration?.isConnected || false,
        calendarProvider: action.payload.calendarIntegration?.provider,
      };
    
    case 'SET_PLAN_NAME':
      return { ...state, planName: action.payload };
    
    case 'SET_PLAN_DESCRIPTION':
      return { ...state, planDescription: action.payload };
    
    case 'SET_SELECTED_COURSES':
      return { ...state, selectedCourseIds: action.payload };
    
    case 'SET_LEARNING_ROUTE':
      return { ...state, learningRouteId: action.payload };
    
    case 'SET_SESSION_TIMES':
      return { 
        ...state, 
        minSessionMinutes: action.payload.min, 
        maxSessionMinutes: action.payload.max 
      };
    
    case 'SET_BREAK_DURATION':
      return { ...state, breakDurationMinutes: action.payload };
    
    case 'SET_GOAL_HOURS':
      return { ...state, goalHoursPerWeek: action.payload };
    
    case 'SET_PREFERRED_DAYS':
      return { ...state, preferredDays: action.payload };
    
    case 'SET_TIME_BLOCKS':
      return { ...state, preferredTimeBlocks: action.payload };
    
    case 'SET_TIME_OF_DAY':
      return { ...state, preferredTimeOfDay: action.payload };
    
    case 'SET_START_DATE':
      return { ...state, startDate: action.payload };
    
    case 'SET_END_DATE':
      return { ...state, endDate: action.payload };
    
    case 'SET_CALENDAR_CONNECTED':
      return { 
        ...state, 
        calendarConnected: action.payload.connected,
        calendarProvider: action.payload.provider,
      };
    
    case 'SET_CALENDAR_EVENTS':
      return { ...state, calendarEvents: action.payload };
    
    case 'SET_LIA_AVAILABILITY_ANALYSIS':
      return { ...state, liaAvailabilityAnalysis: action.payload };
    
    case 'SET_LIA_TIME_ANALYSIS':
      return { ...state, liaTimeAnalysis: action.payload };
    
    case 'SET_GENERATED_PLAN':
      return { 
        ...state, 
        generatedConfig: action.payload.config,
        generatedSessions: action.payload.sessions,
      };
    
    case 'SET_SAVED_PLAN_ID':
      return { ...state, savedPlanId: action.payload };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
}

// ============================================================================
// CONTEXTO
// ============================================================================

interface StudyPlannerContextValue {
  state: StudyPlannerState;
  actions: {
    setPhase: (phase: StudyPlannerPhase) => void;
    nextPhase: () => void;
    previousPhase: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setUserContext: (context: UserContext) => void;
    setPlanName: (name: string) => void;
    setPlanDescription: (description: string) => void;
    setSelectedCourses: (courseIds: string[]) => void;
    setLearningRoute: (routeId: string | undefined) => void;
    setSessionTimes: (min: number, max: number) => void;
    setBreakDuration: (minutes: number) => void;
    setGoalHours: (hours: number) => void;
    setPreferredDays: (days: number[]) => void;
    setTimeBlocks: (blocks: TimeBlock[]) => void;
    setTimeOfDay: (time: 'morning' | 'afternoon' | 'evening' | 'night') => void;
    setStartDate: (date: string) => void;
    setEndDate: (date: string | undefined) => void;
    setCalendarConnected: (connected: boolean, provider?: 'google' | 'microsoft') => void;
    setCalendarEvents: (events: CalendarEvent[]) => void;
    setSofLIAAvailabilityAnalysis: (analysis: SofLIAAvailabilityAnalysis) => void;
    setSofLIATimeAnalysis: (analysis: SofLIATimeAnalysis) => void;
    setGeneratedPlan: (config: StudyPlanConfig, sessions: StudySession[]) => void;
    setSavedPlanId: (planId: string) => void;
    reset: () => void;
    // Acciones asíncronas
    loadUserContext: () => Promise<void>;
    generatePlan: () => Promise<void>;
    savePlan: () => Promise<string | null>;
  };
}

const StudyPlannerContext = createContext<StudyPlannerContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface StudyPlannerProviderProps {
  children: ReactNode;
}

export function StudyPlannerProvider({ children }: StudyPlannerProviderProps) {
  const [state, dispatch] = useReducer(studyPlannerReducer, initialState);

  // Acciones síncronas
  const setPhase = useCallback((phase: StudyPlannerPhase) => {
    dispatch({ type: 'SET_PHASE', payload: phase });
  }, []);

  const nextPhase = useCallback(() => {
    dispatch({ type: 'SET_PHASE', payload: Math.min(state.currentPhase + 1, StudyPlannerPhase.COMPLETE) });
  }, [state.currentPhase]);

  const previousPhase = useCallback(() => {
    dispatch({ type: 'SET_PHASE', payload: Math.max(state.currentPhase - 1, StudyPlannerPhase.WELCOME) });
  }, [state.currentPhase]);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setUserContext = useCallback((context: UserContext) => {
    dispatch({ type: 'SET_USER_CONTEXT', payload: context });
  }, []);

  const setPlanName = useCallback((name: string) => {
    dispatch({ type: 'SET_PLAN_NAME', payload: name });
  }, []);

  const setPlanDescription = useCallback((description: string) => {
    dispatch({ type: 'SET_PLAN_DESCRIPTION', payload: description });
  }, []);

  const setSelectedCourses = useCallback((courseIds: string[]) => {
    dispatch({ type: 'SET_SELECTED_COURSES', payload: courseIds });
  }, []);

  const setLearningRoute = useCallback((routeId: string | undefined) => {
    dispatch({ type: 'SET_LEARNING_ROUTE', payload: routeId });
  }, []);

  const setSessionTimes = useCallback((min: number, max: number) => {
    dispatch({ type: 'SET_SESSION_TIMES', payload: { min, max } });
  }, []);

  const setBreakDuration = useCallback((minutes: number) => {
    dispatch({ type: 'SET_BREAK_DURATION', payload: minutes });
  }, []);

  const setGoalHours = useCallback((hours: number) => {
    dispatch({ type: 'SET_GOAL_HOURS', payload: hours });
  }, []);

  const setPreferredDays = useCallback((days: number[]) => {
    dispatch({ type: 'SET_PREFERRED_DAYS', payload: days });
  }, []);

  const setTimeBlocks = useCallback((blocks: TimeBlock[]) => {
    dispatch({ type: 'SET_TIME_BLOCKS', payload: blocks });
  }, []);

  const setTimeOfDay = useCallback((time: 'morning' | 'afternoon' | 'evening' | 'night') => {
    dispatch({ type: 'SET_TIME_OF_DAY', payload: time });
  }, []);

  const setStartDate = useCallback((date: string) => {
    dispatch({ type: 'SET_START_DATE', payload: date });
  }, []);

  const setEndDate = useCallback((date: string | undefined) => {
    dispatch({ type: 'SET_END_DATE', payload: date });
  }, []);

  const setCalendarConnected = useCallback((connected: boolean, provider?: 'google' | 'microsoft') => {
    dispatch({ type: 'SET_CALENDAR_CONNECTED', payload: { connected, provider } });
  }, []);

  const setCalendarEvents = useCallback((events: CalendarEvent[]) => {
    dispatch({ type: 'SET_CALENDAR_EVENTS', payload: events });
  }, []);

  const setSofLIAAvailabilityAnalysis = useCallback((analysis: SofLIAAvailabilityAnalysis) => {
    dispatch({ type: 'SET_LIA_AVAILABILITY_ANALYSIS', payload: analysis });
  }, []);

  const setSofLIATimeAnalysis = useCallback((analysis: SofLIATimeAnalysis) => {
    dispatch({ type: 'SET_LIA_TIME_ANALYSIS', payload: analysis });
  }, []);

  const setGeneratedPlan = useCallback((config: StudyPlanConfig, sessions: StudySession[]) => {
    dispatch({ type: 'SET_GENERATED_PLAN', payload: { config, sessions } });
  }, []);

  const setSavedPlanId = useCallback((planId: string) => {
    dispatch({ type: 'SET_SAVED_PLAN_ID', payload: planId });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Acciones asíncronas
  const loadUserContext = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/study-planner/user-context');
      const data = await response.json();
      
      if (data.success && data.data) {
        setUserContext(data.data);
      } else {
        throw new Error(data.error || 'Error al cargar contexto');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setUserContext]);

  const generatePlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/study-planner/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.planName,
          description: state.planDescription,
          courseIds: state.selectedCourseIds,
          learningRouteId: state.learningRouteId,
          goalHoursPerWeek: state.goalHoursPerWeek,
          startDate: state.startDate,
          endDate: state.endDate,
          timezone: state.timezone,
          preferredDays: state.preferredDays,
          preferredTimeBlocks: state.preferredTimeBlocks,
          minSessionMinutes: state.minSessionMinutes,
          maxSessionMinutes: state.maxSessionMinutes,
          breakDurationMinutes: state.breakDurationMinutes,
          preferredSessionType: state.maxSessionMinutes <= 25 ? 'short' : state.maxSessionMinutes <= 45 ? 'medium' : 'long',
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setGeneratedPlan(data.data.config, data.data.sessions);
      } else {
        throw new Error(data.error || 'Error al generar plan');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [state, setLoading, setError, setGeneratedPlan]);

  const savePlan = useCallback(async (): Promise<string | null> => {
    if (!state.generatedConfig || state.generatedSessions.length === 0) {
      setError('No hay plan generado para guardar');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/study-planner/save-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: state.generatedConfig,
          sessions: state.generatedSessions,
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setSavedPlanId(data.data.planId);
        setPhase(StudyPlannerPhase.COMPLETE);
        return data.data.planId;
      } else {
        throw new Error(data.error || 'Error al guardar plan');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return null;
    } finally {
      setLoading(false);
    }
  }, [state.generatedConfig, state.generatedSessions, setLoading, setError, setSavedPlanId, setPhase]);

  const value: StudyPlannerContextValue = {
    state,
    actions: {
      setPhase,
      nextPhase,
      previousPhase,
      setLoading,
      setError,
      setUserContext,
      setPlanName,
      setPlanDescription,
      setSelectedCourses,
      setLearningRoute,
      setSessionTimes,
      setBreakDuration,
      setGoalHours,
      setPreferredDays,
      setTimeBlocks,
      setTimeOfDay,
      setStartDate,
      setEndDate,
      setCalendarConnected,
      setCalendarEvents,
      setSofLIAAvailabilityAnalysis,
      setSofLIATimeAnalysis,
      setGeneratedPlan,
      setSavedPlanId,
      reset,
      loadUserContext,
      generatePlan,
      savePlan,
    },
  };

  return (
    <StudyPlannerContext.Provider value={value}>
      {children}
    </StudyPlannerContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useStudyPlanner() {
  const context = useContext(StudyPlannerContext);
  
  if (!context) {
    throw new Error('useStudyPlanner debe usarse dentro de StudyPlannerProvider');
  }
  
  return context;
}

export default StudyPlannerContext;

