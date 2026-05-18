import { logger as techDebtLogger } from '@/lib/utils/logger'
import type { StudyApproach, StudyPlannerAssignedCourse, StudyPlannerCalendarProvider, StudyPlannerUserContext } from '../types/planner-ui.types';
import { generateStudyPlannerPrompt } from '../prompts/study-planner.prompt';

type CalendarProvider = NonNullable<StudyPlannerCalendarProvider>;

export const APPROACH_LABELS: Record<StudyApproach, string> = {
  corto: 'terminar rapido (sesiones de 60-90 minutos)',
  balance: 'ritmo equilibrado (sesiones de 45-60 minutos)',
  largo: 'tomarte tu tiempo (sesiones de 20-35 minutos)',
};

export function normalizeMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function calculateSuggestedDate(approach: StudyApproach): Date {
  const date = new Date();
  const weeks = approach === 'corto' ? 2 : approach === 'balance' ? 4 : 8;
  date.setDate(date.getDate() + weeks * 7);
  return date;
}

export function formatApproachCompletionText(approach: StudyApproach | null): string {
  if (approach === 'corto') return 'terminar rapido';
  if (approach === 'balance') return 'ritmo equilibrado';
  return 'tomarte tu tiempo';
}

export function formatCalendarProvider(provider: CalendarProvider): string {
  return provider === 'google' ? 'Google' : 'Microsoft';
}

export async function resolveConnectedCalendarFromServer(): Promise<CalendarProvider | null> {
  try {
    const response = await fetch('/api/study-planner/calendar/status');
    if (!response.ok) return null;
    const data = await response.json();
    if (data.isConnected && data.provider) return data.provider as CalendarProvider;
  } catch (error) {
    techDebtLogger.error('Error verificando estado del calendario:', error);
  }
  return null;
}

export function buildApproachSystemPrompt(
  approach: StudyApproach,
  calendarProvider: CalendarProvider | null,
  calendarSkipped: boolean,
  resolvedTargetDateText: string,
  assignedCourses: StudyPlannerAssignedCourse[],
): string {
  const courseTitles = assignedCourses.map((c) => c.title).join(', ');
  if (calendarProvider) {
    return `[SELECCION_ENFOQUE_CALENDARIO_CONECTADO]
El usuario ha seleccionado "${APPROACH_LABELS[approach]}" como tipo de sesiones de estudio.
Ya tiene su calendario de ${formatCalendarProvider(calendarProvider)} conectado.
${resolvedTargetDateText ? `La fecha objetivo actual es: ${resolvedTargetDateText}` : ''}

INSTRUCCIONES:
1. Confirma la seleccion del tipo de sesiones.
2. Menciona que el calendario ya esta conectado.
3. Indica que vas a analizar su agenda para encontrar los mejores horarios.
4. Se breve y profesional.`;
  }
  if (calendarSkipped) {
    return `[SELECCION_ENFOQUE_SIN_CALENDARIO]
El usuario ha seleccionado "${APPROACH_LABELS[approach]}" como tipo de sesiones de estudio.
El usuario ya indico que prefiere no conectar su calendario.
${resolvedTargetDateText ? `La fecha objetivo actual es: ${resolvedTargetDateText}` : ''}
Cursos asignados: ${courseTitles}

INSTRUCCIONES:
1. Confirma la seleccion del tipo de sesiones.
2. No vuelvas a pedir calendario.
3. Pide dias y horarios preferidos para estudiar.`;
  }
  return `[SELECCION_ENFOQUE_PERSUADIR_CALENDARIO]
El usuario ha seleccionado "${APPROACH_LABELS[approach]}" como tipo de sesiones de estudio.
${resolvedTargetDateText ? `La fecha objetivo actual es: ${resolvedTargetDateText}` : ''}
Cursos asignados: ${courseTitles}

INSTRUCCIONES:
1. Confirma la seleccion del tipo de sesiones.
2. Explica brevemente el beneficio de conectar el calendario.
3. Pregunta si desea conectar Google o Microsoft Calendar.`;
}

export function buildApproachStudyPlannerPrompt(approach: StudyApproach, assignedCourses: StudyPlannerAssignedCourse[], userContext: StudyPlannerUserContext | null): string {
  const currentDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return generateStudyPlannerPrompt({
    userName: userContext?.userName || undefined,
    studyPlannerContextString: `CURSOS ASIGNADOS:\n${assignedCourses.map((c) => `- ${c.title}${c.dueDate ? ` (Fecha limite: ${new Date(c.dueDate).toLocaleDateString('es-ES')})` : ''}`).join('\n')}\n\nTIPO DE SESION SELECCIONADO: ${APPROACH_LABELS[approach]}`,
    currentDate,
  });
}
