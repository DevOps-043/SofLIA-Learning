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
  getLessonsForPrompt: () => string;
  pendingLessons: StudyPlannerPendingLesson[];
  totalPendingLessons: number;
  assignedCourses: StudyPlannerAssignedCourse[];
  connectedCalendar: 'google' | 'microsoft' | null;
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

function buildFallbackLessonsContext(pendingLessons: StudyPlannerPendingLesson[]): string {
  if (pendingLessons.length === 0) {
    return 'No hay lecciones pendientes definidas aun.';
  }

  return pendingLessons
    .map((lesson) => `- ${lesson.lessonTitle} (${lesson.durationMinutes || 15} min) - Modulo: ${lesson.moduleTitle}`)
    .join('\n');
}

function buildDueDateContext(assignedCourses: StudyPlannerAssignedCourse[]): string {
  const coursesWithDueDates = assignedCourses.filter((course) => course.dueDate);
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

function detectPlannerDays(message: string): string[] {
  const matches = message.match(
    /lunes|lune|lun|mon|martes|mar|tue|miercoles|miércoles|mier|wed|jueves|jue|thu|viernes|vier|vie|fri|sabado|sábado|sab|sat|domingo|dom|sun/gi,
  );

  return matches ? [...new Set(matches.map((day) => day.toLowerCase()))] : [];
}

function detectPlannerTimes(message: string): string[] {
  const matches = message.match(/manana|mañana|tarde|noche/gi);
  if (!matches) {
    return ['manana'];
  }

  return [...new Set(matches.map((time) => time.toLowerCase()))];
}

function getNearestDeadlineDate(assignedCourses: StudyPlannerAssignedCourse[]): string | undefined {
  const coursesWithDueDates = assignedCourses.filter((course) => course.dueDate);
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
  >,
): Promise<DeterministicPlanContextResult> {
  const uniqueDays = detectPlannerDays(params.message);
  if (uniqueDays.length === 0 || params.lessons.length === 0) {
    return {
      blockPlanGeneration: false,
      preCalculatedPlanContext: '',
    };
  }

  const uniqueTimes = detectPlannerTimes(params.message);
  const deadlineDate = getNearestDeadlineDate(params.assignedCourses);

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
        maxConsecutiveHours: params.studyApproach === 'corto' ? 3 : 2,
      },
      deadlineDate,
      maxSessionMinutes: params.studyApproach === 'corto' ? 75 : params.studyApproach === 'largo' ? 25 : 45,
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

  const lessonsContext =
    params.lessonsAreReady && params.lessons.length > 0
      ? params.getLessonsForPrompt()
      : buildFallbackLessonsContext(params.pendingLessons);

  const dueDateContext = buildDueDateContext(params.assignedCourses);
  const existingPlanContext = buildExistingPlanContext(params.savedLessonDistribution);
  const deterministicContext = await buildDeterministicPlanContext({
    message: params.message,
    lessons: params.lessons,
    assignedCourses: params.assignedCourses,
    studyApproach: params.studyApproach,
  });

  const finalStudyPlannerContext = deterministicContext.blockPlanGeneration
    ? `SISTEMA: INFORMACION DE LECCIONES OCULTA POR INSUFICIENCIA DE HORARIO.\n${deterministicContext.preCalculatedPlanContext}`
    : `LECCIONES PENDIENTES (${params.totalPendingLessons} total):\n${lessonsContext}\n\nCALENDARIO: ${params.connectedCalendar ? `Conectado (${params.connectedCalendar})` : 'No conectado'}${dueDateContext}${deterministicContext.preCalculatedPlanContext}${existingPlanContext}`;

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
