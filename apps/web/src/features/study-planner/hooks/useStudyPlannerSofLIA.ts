import { useState, useCallback, useEffect, useRef } from 'react';
import {
  type PhaseData,
  type Message,
  type StudyPlannerSofLIAState,
  type StudyPlannerSofLIAActions,
  StudyPlannerPhase,
  initialSofLIAState,
} from './useStudyPlannerSofLIA.types';
import {
  fetchUserContext,
  sendMessageToSofLIA,
  generateStudyPlanRequest,
  savePlanRequest,
} from './useStudyPlannerSofLIA-api.service';

export type { PhaseData, Message, StudyPlannerSofLIAState, StudyPlannerSofLIAActions };
export { StudyPlannerPhase };

export function useStudyPlannerSofLIA(): StudyPlannerSofLIAState & StudyPlannerSofLIAActions {
  const [state, setState] = useState<StudyPlannerSofLIAState>(initialSofLIAState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadUserContext = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const userContext = await fetchUserContext();
      if (userContext) {
        setState((prev) => ({
          ...prev,
          phaseData: {
            ...prev.phaseData,
            userContext,
            selectedCourseIds: userContext.courses.map((c) => c.courseId),
            calendarConnected: userContext.calendarIntegration?.isConnected,
            calendarProvider: userContext.calendarIntegration?.provider,
          },
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Error cargando contexto:', error);
      setState((prev) => ({
        ...prev,
        error: 'Error al cargar tu información. Por favor, recarga la página.',
        isLoading: false,
      }));
    }
  }, []);

  useEffect(() => { void loadUserContext(); }, [loadUserContext]);

  useEffect(() => {
    return () => { abortControllerRef.current?.abort(); };
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      phase: state.currentPhase,
    };

    setState((prev) => ({ ...prev, messages: [...prev.messages, userMessage], isLoading: true, error: null }));

    try {
      const responseText = await sendMessageToSofLIA({
        message,
        currentPhase: state.currentPhase,
        recentMessages: state.messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        selectedCourseCount: state.phaseData.selectedCourseIds?.length || 0,
        signal: abortControllerRef.current.signal,
      });

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        phase: state.currentPhase,
      };

      setState((prev) => ({ ...prev, messages: [...prev.messages, assistantMessage], isLoading: false }));
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Error enviando mensaje:', error);
      setState((prev) => ({
        ...prev,
        error: 'Error al comunicarse con SofLIA. Por favor, intenta de nuevo.',
        isLoading: false,
      }));
    }
  }, [state.currentPhase, state.messages, state.phaseData.selectedCourseIds]);

  const sendVoiceMessage = useCallback(async (transcript: string) => {
    setState((prev) => ({ ...prev, isListening: false }));
    return sendMessage(transcript);
  }, [sendMessage]);

  const goToPhase = useCallback((phase: StudyPlannerPhase) => {
    setState((prev) => ({ ...prev, currentPhase: phase }));
  }, []);

  const nextPhase = useCallback(() => {
    setState((prev) => ({ ...prev, currentPhase: Math.min(prev.currentPhase + 1, StudyPlannerPhase.COMPLETE) }));
  }, []);

  const previousPhase = useCallback(() => {
    setState((prev) => ({ ...prev, currentPhase: Math.max(prev.currentPhase - 1, StudyPlannerPhase.WELCOME) }));
  }, []);

  const updatePhaseData = useCallback((data: Partial<PhaseData>) => {
    setState((prev) => ({ ...prev, phaseData: { ...prev.phaseData, ...data } }));
  }, []);

  const setIsListening = useCallback((listening: boolean) => {
    setState((prev) => ({ ...prev, isListening: listening }));
  }, []);

  const setIsSpeaking = useCallback((speaking: boolean) => {
    setState((prev) => ({ ...prev, isSpeaking: speaking }));
  }, []);

  const generatePlan = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const sessions = await generateStudyPlanRequest(state.phaseData);
      setState((prev) => ({ ...prev, phaseData: { ...prev.phaseData, generatedSessions: sessions }, isLoading: false }));
    } catch (error) {
      console.error('Error generando plan:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al generar el plan',
        isLoading: false,
      }));
    }
  }, [state.phaseData]);

  const savePlan = useCallback(async (): Promise<{ planId: string; sessionIds: string[] } | null> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await savePlanRequest(state.phaseData);
      if (result) setState((prev) => ({ ...prev, currentPhase: StudyPlannerPhase.COMPLETE, isLoading: false }));
      return result;
    } catch (error) {
      console.error('Error guardando plan:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al guardar el plan',
        isLoading: false,
      }));
      return null;
    }
  }, [state.phaseData]);

  const clearError = useCallback(() => setState((prev) => ({ ...prev, error: null })), []);

  const reset = useCallback(() => {
    setState(initialSofLIAState);
    void loadUserContext();
  }, [loadUserContext]);

  return {
    ...state,
    sendMessage, sendVoiceMessage,
    goToPhase, nextPhase, previousPhase,
    updatePhaseData, setIsListening, setIsSpeaking,
    generatePlan, savePlan, clearError, reset,
  };
}

export default useStudyPlannerSofLIA;
