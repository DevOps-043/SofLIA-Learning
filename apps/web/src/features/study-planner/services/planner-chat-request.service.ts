import { generateStudyPlannerPrompt } from '../prompts/study-planner.prompt';
import type { LessonData } from '../hooks/useSofLIAData';
import type {
  StudyApproach,
  StudyPlannerAssignedCourse,
  StudyPlannerMessage,
  StudyPlannerPendingLesson,
} from '../types/planner-ui.types';
import type { StudyPlannerStoredLessonDistribution } from '../types/planner-schedule.types';

interface BuildStudyPlannerChatRequestContextParams {
  message: string;
  userName?: string | null;
  lessonsAreReady: boolean;
  lessons: LessonData[];
  getLessonsForPrompt: (selectedCourseIds?: string[]) => string;
  pendingLessons: StudyPlannerPendingLesson[];
  totalPendingLessons: number;
  assignedCourses: StudyPlannerAssignedCourse[];
  connectedCalendar: 'google' | 'microsoft' | null;
  selectedCourseIds?: string[];
  studyApproach: StudyApproach | null;
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[];
}

interface SendStudyPlannerChatRequestParams {
  message: string;
  conversationHistory: StudyPlannerMessage[];
  systemPrompt: string;
  signal?: AbortSignal;
  userName?: string | null;
}

interface StudyPlannerChatRequestResult {
  response: string;
  conversationId?: string;
}

interface DeterministicPlanAlternative {
  description: string;
  estimatedEndDate: string;
  daysBeforeDeadline: number;
}

interface DeterministicPlanResponse {
  exceedsDeadline?: boolean;
  validAlternatives?: DeterministicPlanAlternative[];
  plan?: string;
  endDate?: string;
  deadline?: string;
  daysExcess?: number;
}

interface DeterministicPlanContextResult {
  blockPlanGeneration: boolean;
  preCalculatedPlanContext: string;
}

function buildFallbackLessonsContext(
  pendingLessons: StudyPlannerPendingLesson[],
  resolvedCourseIds?: string[],
): string {
  const filtered = resolvedCourseIds && resolvedCourseIds.length > 0
    ? pendingLessons.filter((l) => resolvedCourseIds.includes(l.courseId))
    : pendingLessons;

  if (filtered.length === 0) {
    return 'No hay lecciones pendientes definidas aun.';
  }

  return filtered
    .map((lesson) => `- ${lesson.lessonTitle} (${lesson.durationMinutes || 15} min) - Modulo: ${lesson.moduleTitle}`)
    .join('\n');
}

function buildDueDateContext(
  assignedCourses: StudyPlannerAssignedCourse[],
  resolvedCourseIds?: string[],
): string {
  const relevantCourses = resolvedCourseIds && resolvedCourseIds.length > 0
    ? assignedCourses.filter((c) => resolvedCourseIds.includes(c.courseId))
    : assignedCourses;

  const coursesWithDueDates = relevantCourses.filter((course) => course.dueDate);
  if (coursesWithDueDates.length === 0) {
    return '';
  }

  const nearestDueDate = [...coursesWithDueDates]
    .sort((left, right) => new Date(left.dueDate!).getTime() - new Date(right.dueDate!).getTime())[0];

  const dueDateFormatted = new Date(nearestDueDate.dueDate!).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `\n\nFECHA LIMITE OBLIGATORIA: ${dueDateFormatted}\nNunca programes lecciones despues de esta fecha.`;
}

function buildExistingPlanContext(savedLessonDistribution: StudyPlannerStoredLessonDistribution[]): string {
  if (savedLessonDistribution.length === 0) {
    return '';
  }

  const slots = savedLessonDistribution
    .slice(0, 20)
    .map((slot) => {
      const lessons = slot.lessons.map((lesson) => lesson.lessonTitle).join(', ');
      return `- ${slot.dayName} ${slot.dateStr} ${slot.startTime}-${slot.endTime}: ${lessons}`;
    })
    .join('\n');

  return `\n\nPLAN EXISTENTE EN MEMORIA:\n${slots}\n\nSi el usuario esta confirmando o ajustando este plan, reutiliza exactamente estos horarios como base.`;
}

/**
 * Ordered day names for range expansion (lunes=0…domingo=6).
 */
const ORDERED_DAY_NAMES = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

/**
 * Detects study days from user message, with support for:
 * - Individual days: "lunes y miercoles"
 * - Day ranges: "lunes a viernes", "lunes a sabado"
 * - BUG-D fix: expands ranges to include all intermediate days.
 */
function detectPlannerDays(message: string): string[] {
  const normalizedMsg = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Try to detect a range pattern: "lunes a/al sabado"
  const rangePattern = /(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\s+(?:a|al|hasta)\s+(lunes|martes|miercoles|jueves|viernes|sabado|domingo)/i;
  const rangeMatch = normalizedMsg.match(rangePattern);

  if (rangeMatch) {
    const startDay = rangeMatch[1].toLowerCase();
    const endDay = rangeMatch[2].toLowerCase();
    const startIdx = ORDERED_DAY_NAMES.indexOf(startDay);
    const endIdx = ORDERED_DAY_NAMES.indexOf(endDay);

    if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
      return ORDERED_DAY_NAMES.slice(startIdx, endIdx + 1);
    }
  }

  // Fallback: detect individual days
  const dayPattern = /lunes|lune|lun|martes|mar|miercoles|miércoles|mier|jueves|jue|viernes|vier|vie|sabado|sábado|sab|domingo|dom/gi;
  const matches = normalizedMsg.match(dayPattern);
  if (!matches) {
    return [];
  }

  // Normalize abbreviated day names to full names
  const normMap: Record<string, string> = {
    lun: 'lunes', lune: 'lunes', lunes: 'lunes',
    mar: 'martes', martes: 'martes',
    mier: 'miercoles', miercoles: 'miercoles',
    jue: 'jueves', jueves: 'jueves',
    vie: 'viernes', vier: 'viernes', viernes: 'viernes',
    sab: 'sabado', sabado: 'sabado',
    dom: 'domingo', domingo: 'domingo',
  };

  return [...new Set(
    matches
      .map(d => d.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      .map(d => normMap[d] || d)
  )];
}

/**
 * Detects time-of-day preferences from user message.
 * BUG-E fix: recognizes "horario laboral", "horario de trabajo", "jornada laboral"
 * as a "mañana" + "tarde" preference (typical work hours 8-18).
 */
function detectPlannerTimes(message: string): string[] {
  const normalizedMsg = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Detect "horario laboral" / "jornada laboral" / "horario de trabajo"
  if (
    normalizedMsg.includes('horario laboral') ||
    normalizedMsg.includes('jornada laboral') ||
    normalizedMsg.includes('horario de trabajo') ||
    normalizedMsg.includes('horas laborales')
  ) {
    return ['manana', 'tarde'];
  }

  const matches = normalizedMsg.match(/manana|mañana|tarde|noche/gi);
  if (!matches) {
    return ['manana'];
  }

  return [...new Set(
    matches.map(t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
  )];
}

/**
 * Parses an explicit study duration from the user's message.
 * BUG-C fix: when the user says "2 horas" or "120 minutos", this value
 * should override the approach-based default.
 *
 * Returns null if no explicit duration was found.
 */
function detectExplicitSessionDuration(message: string): number | null {
  const normalizedMsg = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Match "N hora(s)" pattern
  const hoursMatch = normalizedMsg.match(/(\d+(?:\.\d+)?)\s*(?:hora|horas|hr|hrs)/i);
  if (hoursMatch) {
    return Math.round(parseFloat(hoursMatch[1]) * 60);
  }

  // Match "N minuto(s)" pattern
  const minutesMatch = normalizedMsg.match(/(\d+)\s*(?:minuto|minutos|min|mins)/i);
  if (minutesMatch) {
    return parseInt(minutesMatch[1], 10);
  }

  return null;
}

function getNearestDeadlineDate(
  assignedCourses: StudyPlannerAssignedCourse[],
  resolvedCourseIds?: string[],
): string | undefined {
  const relevantCourses = resolvedCourseIds && resolvedCourseIds.length > 0
    ? assignedCourses.filter((c) => resolvedCourseIds.includes(c.courseId))
    : assignedCourses;

  const coursesWithDueDates = relevantCourses.filter((course) => course.dueDate);
  if (coursesWithDueDates.length === 0) {
    return undefined;
  }

  return [...coursesWithDueDates]
    .sort((left, right) => new Date(left.dueDate!).getTime() - new Date(right.dueDate!).getTime())[0]
    .dueDate ?? undefined;
}

function buildAlternativesContext(alternatives: DeterministicPlanAlternative[]): string {
  if (alternatives.length === 0) {
    return [
      'ADVERTENCIA: La fecha limite es muy ajustada.',
      'Para completar el curso a tiempo necesitas estudiar todos los dias con sesiones intensivas.',
      'Considera solicitar una extension de la fecha limite a tu instructor.',
    ].join('\n');
  }

  return alternatives
    .map((alternative, index) => [
      `OPCION ${index + 1}: ${alternative.description}`,
      `   Terminarias el ${alternative.estimatedEndDate} (${alternative.daysBeforeDeadline} dias antes del deadline)`,
    ].join('\n'))
    .join('\n\n');
}

async function buildDeterministicPlanContext(
  params: Pick<
    BuildStudyPlannerChatRequestContextParams,
    'assignedCourses' | 'lessons' | 'message' | 'studyApproach'
  > & { explicitSessionMinutes?: number | null; resolvedCourseIds?: string[] },
): Promise<DeterministicPlanContextResult> {
  const uniqueDays = detectPlannerDays(params.message);
  if (uniqueDays.length === 0 || params.lessons.length === 0) {
    return {
      blockPlanGeneration: false,
      preCalculatedPlanContext: '',
    };
  }

  const uniqueTimes = detectPlannerTimes(params.message);
  const deadlineDate = getNearestDeadlineDate(params.assignedCourses, params.resolvedCourseIds);

  // BUG-C: Explicit duration from user takes priority over approach-based default
  const approachBasedMinutes = params.studyApproach === 'corto' ? 75 : params.studyApproach === 'largo' ? 25 : 45;
  const maxSessionMinutes = params.explicitSessionMinutes ?? approachBasedMinutes;

  // Compute maxConsecutiveHours from explicitSessionMinutes when available
  const maxConsecutiveHours = params.explicitSessionMinutes
    ? Math.max(1, Math.ceil(params.explicitSessionMinutes / 60))
    : params.studyApproach === 'corto' ? 3 : 2;

  const response = await fetch('/api/study-planner/generate-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lessons: params.lessons,
      preferences: {
        days: uniqueDays,
        times: uniqueTimes,
        studyMode:
          params.studyApproach === 'corto'
            ? 'intensive'
            : params.studyApproach === 'largo'
              ? 'pomodoro'
              : 'balanced',
        maxConsecutiveHours,
      },
      deadlineDate,
      maxSessionMinutes,
    }),
  });

  if (!response.ok) {
    return {
      blockPlanGeneration: false,
      preCalculatedPlanContext: '',
    };
  }

  const payload = (await response.json()) as DeterministicPlanResponse;

  if (payload.exceedsDeadline) {
    const validAlternatives = payload.validAlternatives ?? [];
    const alternativeOptions = buildAlternativesContext(validAlternatives);

    return {
      blockPlanGeneration: true,
      preCalculatedPlanContext: [
        'BLOQUEO DE SEGURIDAD: Los horarios propuestos no cumplen la fecha limite.',
        `Fecha estimada de terminacion: ${payload.endDate ?? 'No disponible'}`,
        `Fecha limite del curso: ${payload.deadline ?? 'No disponible'}`,
        `Exceso estimado: ${payload.daysExcess ?? 0} dias`,
        '',
        'INSTRUCCION CRITICA PARA LIA:',
        `1. Informa que con los horarios "${uniqueDays.join(', ')} por la ${uniqueTimes.join(' y ')}" no se llega a tiempo.`,
        '2. No muestres ni inventes ninguna leccion fuera del plan validado.',
        '3. Propone directamente estas alternativas ya validadas:',
        alternativeOptions,
        `4. Cada opcion ya fue calculada para terminar antes de ${payload.deadline ?? 'la fecha limite'}.`,
        '5. Pregunta cual opcion prefiere el usuario.',
        '6. Si el usuario elige una opcion, genera el plan inmediatamente con esos horarios.',
        `7. Datos estructurados de las alternativas:\n${JSON.stringify(validAlternatives)}`,
      ].join('\n'),
    };
  }

  if (!payload.plan) {
    return {
      blockPlanGeneration: false,
      preCalculatedPlanContext: '',
    };
  }

  return {
    blockPlanGeneration: false,
    preCalculatedPlanContext: [
      'PLAN PRECALCULADO VALIDADO:',
      payload.plan,
      '',
      'INSTRUCCION OBLIGATORIA PARA LIA:',
      '1. No recalcules este plan.',
      '2. Copia los horarios y las lecciones exactamente como aparecen arriba.',
      '3. Las lecciones secuenciales ya vienen agrupadas correctamente.',
      '4. Solo mejora el formato visual de la respuesta.',
    ].join('\n'),
  };
}

export async function buildStudyPlannerChatRequestContext(
  params: BuildStudyPlannerChatRequestContextParams,
): Promise<{ systemPrompt: string }> {
  const sendMsgDateStr = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Filter lessons to only those from the selected course (BUG-A fix)
  const filteredLessons = params.selectedCourseIds && params.selectedCourseIds.length > 0
    ? params.lessons.filter(l => params.selectedCourseIds!.includes(l.courseId))
    : params.lessons;

  const lessonsContext =
    params.lessonsAreReady && filteredLessons.length > 0
      ? params.getLessonsForPrompt(params.selectedCourseIds)
      : buildFallbackLessonsContext(params.pendingLessons);

  const filteredPendingCount = filteredLessons.length || params.totalPendingLessons;

  const resolvedCourseIds = params.selectedCourseIds && params.selectedCourseIds.length > 0
    ? params.selectedCourseIds
    : undefined;

  const dueDateContext = buildDueDateContext(params.assignedCourses, resolvedCourseIds);
  const existingPlanContext = buildExistingPlanContext(params.savedLessonDistribution);

  // BUG-C fix: If user states explicit duration, use it instead of approach default
  const explicitDuration = detectExplicitSessionDuration(params.message);

  const deterministicContext = await buildDeterministicPlanContext({
    message: params.message,
    lessons: filteredLessons,
    assignedCourses: params.assignedCourses,
    studyApproach: params.studyApproach,
    explicitSessionMinutes: explicitDuration,
    resolvedCourseIds,
  });

  const finalStudyPlannerContext = deterministicContext.blockPlanGeneration
    ? `SISTEMA: INFORMACION DE LECCIONES OCULTA POR INSUFICIENCIA DE HORARIO.\n${deterministicContext.preCalculatedPlanContext}`
    : `LECCIONES PENDIENTES (${filteredPendingCount} total):\n${lessonsContext}\n\nCALENDARIO: ${params.connectedCalendar ? `Conectado (${params.connectedCalendar})` : 'No conectado'}${dueDateContext}${deterministicContext.preCalculatedPlanContext}${existingPlanContext}`;

  return {
    systemPrompt: generateStudyPlannerPrompt({
      userName: params.userName || undefined,
      studyPlannerContextString: finalStudyPlannerContext,
      currentDate: sendMsgDateStr,
    }),
  };
}

export async function sendStudyPlannerChatRequest(
  params: SendStudyPlannerChatRequestParams,
): Promise<StudyPlannerChatRequestResult> {
  const response = await fetch('/api/study-planner-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: params.signal,
    body: JSON.stringify({
      message: params.message,
      conversationHistory: params.conversationHistory,
      systemPrompt: params.systemPrompt,
      userName: params.userName || undefined,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al comunicarse con LIA: ${response.status} ${response.statusText}. ${errorText}`);
  }

  const payload = (await response.json()) as StudyPlannerChatRequestResult;

  return {
    response: payload.response,
    conversationId: payload.conversationId,
  };
}
