import type { UserContext, StudyPlanConfig, StudySession } from '../types/user-context.types';
import { generateStudyPlannerPrompt } from '../prompts/study-planner.prompt';
import { type PhaseData, StudyPlannerPhase, getSessionType } from './useStudyPlannerSofLIA.types';

export async function fetchUserContext(): Promise<UserContext | null> {
  const response = await fetch('/api/study-planner/user-context');
  if (!response.ok) throw new Error('Error al cargar el contexto del usuario');
  const data = await response.json();
  if (data.success && data.data) return data.data as UserContext;
  return null;
}

interface SendMessageParams {
  message: string;
  currentPhase: StudyPlannerPhase;
  recentMessages: Array<{ role: string; content: string }>;
  selectedCourseCount: number;
  signal: AbortSignal;
}

export async function sendMessageToSofLIA(params: SendMessageParams): Promise<string> {
  const { message, currentPhase, recentMessages, selectedCourseCount, signal } = params;

  const dateStr = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const systemPrompt = generateStudyPlannerPrompt({
    userName: undefined,
    studyPlannerContextString: `FASE ACTUAL: ${StudyPlannerPhase[currentPhase]}\nCURSOS SELECCIONADOS: ${selectedCourseCount}`,
    currentDate: dateStr,
  });

  const response = await fetch('/api/study-planner-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationHistory: recentMessages, systemPrompt, userName: undefined }),
    signal,
  });

  if (!response.ok) throw new Error('Error al comunicarse con SofLIA');

  const data = await response.json();
  return data.response as string;
}

export async function generateStudyPlanRequest(phaseData: PhaseData): Promise<StudySession[]> {
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

  if (!response.ok) throw new Error('Error al generar el plan');

  const data = await response.json();
  if (data.success && data.data) return data.data.sessions as StudySession[];
  return [];
}

export async function savePlanRequest(
  phaseData: PhaseData,
): Promise<{ planId: string; sessionIds: string[] } | null> {
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
    body: JSON.stringify({ config, sessions: phaseData.generatedSessions }),
  });

  if (!response.ok) throw new Error('Error al guardar el plan');

  const data = await response.json();
  if (data.success && data.data) {
    return { planId: data.data.planId, sessionIds: data.data.sessionIds || [] };
  }
  return null;
}
