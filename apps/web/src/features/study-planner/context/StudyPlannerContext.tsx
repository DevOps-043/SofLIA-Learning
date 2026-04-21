'use client';

import React, { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { CalendarEvent, SofLIAAvailabilityAnalysis, SofLIATimeAnalysis, StudyPlanConfig, StudySession, TimeBlock, UserContext } from '../types/user-context.types';
import {
  type StudyPlannerContextValue,
  type StudyPlannerState,
  initialStudyPlannerState,
  StudyPlannerPhase,
} from './study-planner-context.types';
import { studyPlannerReducer } from './study-planner.reducer';

const StudyPlannerContext = createContext<StudyPlannerContextValue | null>(null);

interface StudyPlannerProviderProps {
  children: ReactNode;
}

export function StudyPlannerProvider({ children }: StudyPlannerProviderProps) {
  const [state, dispatch] = useReducer(studyPlannerReducer, initialStudyPlannerState);

  const setPhase = useCallback((phase: StudyPlannerPhase) => dispatch({ type: 'SET_PHASE', payload: phase }), []);
  const nextPhase = useCallback(() => dispatch({ type: 'SET_PHASE', payload: Math.min(state.currentPhase + 1, StudyPlannerPhase.COMPLETE) }), [state.currentPhase]);
  const previousPhase = useCallback(() => dispatch({ type: 'SET_PHASE', payload: Math.max(state.currentPhase - 1, StudyPlannerPhase.WELCOME) }), [state.currentPhase]);
  const setLoading = useCallback((loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }), []);
  const setError = useCallback((error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }), []);
  const setUserContext = useCallback((context: UserContext) => dispatch({ type: 'SET_USER_CONTEXT', payload: context }), []);
  const setPlanName = useCallback((name: string) => dispatch({ type: 'SET_PLAN_NAME', payload: name }), []);
  const setPlanDescription = useCallback((description: string) => dispatch({ type: 'SET_PLAN_DESCRIPTION', payload: description }), []);
  const setSelectedCourses = useCallback((courseIds: string[]) => dispatch({ type: 'SET_SELECTED_COURSES', payload: courseIds }), []);
  const setLearningRoute = useCallback((routeId: string | undefined) => dispatch({ type: 'SET_LEARNING_ROUTE', payload: routeId }), []);
  const setSessionTimes = useCallback((min: number, max: number) => dispatch({ type: 'SET_SESSION_TIMES', payload: { min, max } }), []);
  const setBreakDuration = useCallback((minutes: number) => dispatch({ type: 'SET_BREAK_DURATION', payload: minutes }), []);
  const setGoalHours = useCallback((hours: number) => dispatch({ type: 'SET_GOAL_HOURS', payload: hours }), []);
  const setPreferredDays = useCallback((days: number[]) => dispatch({ type: 'SET_PREFERRED_DAYS', payload: days }), []);
  const setTimeBlocks = useCallback((blocks: TimeBlock[]) => dispatch({ type: 'SET_TIME_BLOCKS', payload: blocks }), []);
  const setTimeOfDay = useCallback((time: 'morning' | 'afternoon' | 'evening' | 'night') => dispatch({ type: 'SET_TIME_OF_DAY', payload: time }), []);
  const setStartDate = useCallback((date: string) => dispatch({ type: 'SET_START_DATE', payload: date }), []);
  const setEndDate = useCallback((date: string | undefined) => dispatch({ type: 'SET_END_DATE', payload: date }), []);
  const setCalendarConnected = useCallback((connected: boolean, provider?: 'google' | 'microsoft') => dispatch({ type: 'SET_CALENDAR_CONNECTED', payload: { connected, provider } }), []);
  const setCalendarEvents = useCallback((events: CalendarEvent[]) => dispatch({ type: 'SET_CALENDAR_EVENTS', payload: events }), []);
  const setSofLIAAvailabilityAnalysis = useCallback((analysis: SofLIAAvailabilityAnalysis) => dispatch({ type: 'SET_LIA_AVAILABILITY_ANALYSIS', payload: analysis }), []);
  const setSofLIATimeAnalysis = useCallback((analysis: SofLIATimeAnalysis) => dispatch({ type: 'SET_LIA_TIME_ANALYSIS', payload: analysis }), []);
  const setGeneratedPlan = useCallback((config: StudyPlanConfig, sessions: StudySession[]) => dispatch({ type: 'SET_GENERATED_PLAN', payload: { config, sessions } }), []);
  const setSavedPlanId = useCallback((planId: string) => dispatch({ type: 'SET_SAVED_PLAN_ID', payload: planId }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

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
        body: JSON.stringify({ config: state.generatedConfig, sessions: state.generatedSessions }),
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
      setPhase, nextPhase, previousPhase, setLoading, setError, setUserContext,
      setPlanName, setPlanDescription, setSelectedCourses, setLearningRoute,
      setSessionTimes, setBreakDuration, setGoalHours, setPreferredDays,
      setTimeBlocks, setTimeOfDay, setStartDate, setEndDate,
      setCalendarConnected, setCalendarEvents,
      setSofLIAAvailabilityAnalysis, setSofLIATimeAnalysis,
      setGeneratedPlan, setSavedPlanId, reset,
      loadUserContext, generatePlan, savePlan,
    },
  };

  return (
    <StudyPlannerContext.Provider value={value}>
      {children}
    </StudyPlannerContext.Provider>
  );
}

export function useStudyPlanner() {
  const context = useContext(StudyPlannerContext);
  if (!context) {
    throw new Error('useStudyPlanner debe usarse dentro de StudyPlannerProvider');
  }
  return context;
}

export { StudyPlannerPhase };
export type { StudyPlannerState };
export default StudyPlannerContext;
