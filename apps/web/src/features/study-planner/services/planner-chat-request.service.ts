import { generateStudyPlannerPrompt } from '../prompts/study-planner.prompt';
import type { LessonData } from '../hooks/useSofLIAData';
import type {
  StudyApproach,
  StudyPlannerAssignedCourse,
  StudyPlannerMessage,
  StudyPlannerPendingLesson,
} from '../types/planner-ui.types';
import type {
  StudyPlannerCalendarDataMap,
  StudyPlannerCalendarEventLike,
  StudyPlannerStoredLessonDistribution,
} from '../types/planner-schedule.types';

// ---------------------------------------------------------------------------
// Calendar data fetch (resolves work block data when savedCalendarData is null)
// ---------------------------------------------------------------------------

interface CalendarEventRaw {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  status: string;
}

/**
 * Fetches calendar events from the server and converts them into the
 * StudyPlannerCalendarDataMap shape. Called when savedCalendarData is null
 * but a calendar is connected, which happens when the user sends their first
 * planning message before analyzeCalendarAndSuggest has completed.
 *
 * Uses a 30-day window (today + 30 days) — enough to cover any course plan.
 */
async function fetchCalendarEventsAsDataMap(): Promise<StudyPlannerCalendarDataMap | null> {
  try {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const response = await fetch(`/api/study-planner/calendar/availability?${params.toString()}`);
    if (!response.ok) return null;

    const payload = (await response.json()) as {
      success: boolean;
      data?: { 
         isConnected: boolean; 
         events: CalendarEventRaw[];
         availability?: import('../types/calendar-integration.types').CalendarAvailability[];
      };
    };

    if (!payload.success || !payload.data?.isConnected) return null;

    const events = payload.data.events ?? [];
    const rawAvailability = payload.data.availability ?? [];
    const dataMap: StudyPlannerCalendarDataMap = {};
    
    // Map availability first
    for (const avail of rawAvailability) {
       dataMap[avail.date] = { busySlots: [], events: [], availability: avail };
    }

    for (const event of events) {
      if (!event.startTime) continue;
      const dateKey = event.startTime.slice(0, 10); // "YYYY-MM-DD"
      if (!dataMap[dateKey]) {
        dataMap[dateKey] = { busySlots: [], events: [] };
      }
      dataMap[dateKey].events.push({
        title: event.title,
        startTime: event.startTime,
        endTime: event.endTime,
        isAllDay: event.isAllDay,
      });
    }

    return Object.keys(dataMap).length > 0 ? dataMap : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Work block heuristics (client-side, mirrors calendar-availability.service.ts)
// ---------------------------------------------------------------------------

const WORK_BLOCK_TITLE_PATTERN =
  /(trabajo|work|oficina|jornada|laboral|shift|turno|servi[çc]o|expediente)/i;
const WORK_BLOCK_EXCLUDE_PATTERN =
  /(junta|reuni[oó]n|reuni[aã]o|meeting|llamada|chamada|profundo|deep[\s\-]?work|focus[\s\-]?time|concentraci[oó]n)/i;
const WORK_BLOCK_MIN_DURATION_MINUTES = 180;

/**
 * Returns true when a calendar event represents a work-day availability
 * container (work shift), using the same heuristic as the server-side
 * `isWorkBlock` in `calendar-availability.service.ts`.
 */
function isWorkBlockEvent(event: StudyPlannerCalendarEventLike): boolean {
  const title = event.title ?? event.summary ?? '';
  if (!title) return false;

  const rawStart = event.start ?? event.startTime;
  const rawEnd = event.end ?? event.endTime;
  if (!rawStart || !rawEnd) return false;

  const start = new Date(rawStart as string);
  const end = new Date(rawEnd as string);
  const durationMinutes = (end.getTime() - start.getTime()) / 60_000;
  if (durationMinutes < WORK_BLOCK_MIN_DURATION_MINUTES) return false;

  if (WORK_BLOCK_EXCLUDE_PATTERN.test(title)) return false;
  return WORK_BLOCK_TITLE_PATTERN.test(title);
}

/**
 * Derives real calendar start times per day from work block events.
 * Returns a map of YYYY-MM-DD → "HH:MM" representing the start of the
 * earliest work block on each day.
 */
function deriveCalendarStartTimesByDay(
  calendarData: StudyPlannerCalendarDataMap,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [dateStr, dayData] of Object.entries(calendarData)) {
    for (const event of dayData.events) {
      if (!isWorkBlockEvent(event)) continue;

      const rawStart = event.start ?? event.startTime;
      if (!rawStart) continue;

      const start = new Date(rawStart as string);
      const hh = start.getHours().toString().padStart(2, '0');
      const mm = start.getMinutes().toString().padStart(2, '0');
      const time = `${hh}:${mm}`;

      // Keep the earliest work block start for the day
      if (!result[dateStr] || time < result[dateStr]) {
        result[dateStr] = time;
      }
    }
  }

  return result;
}

/**
 * Derives real calendar end times per day from work block events.
 * Returns a map of YYYY-MM-DD → "HH:MM" representing the end of the
 * latest work block on each day.
 *
 * Used by the deterministic plan generator to ensure study sessions
 * never exceed the user's official work shift end time.
 */
function deriveCalendarEndTimesByDay(
  calendarData: StudyPlannerCalendarDataMap,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [dateStr, dayData] of Object.entries(calendarData)) {
    for (const event of dayData.events) {
      if (!isWorkBlockEvent(event)) continue;

      const rawEnd = event.end ?? event.endTime;
      if (!rawEnd) continue;

      const end = new Date(rawEnd as string);
      const hh = end.getHours().toString().padStart(2, '0');
      const mm = end.getMinutes().toString().padStart(2, '0');
      const time = `${hh}:${mm}`;

      // Keep the latest work block end for the day
      if (!result[dateStr] || time > result[dateStr]) {
        result[dateStr] = time;
      }
    }
  }

  return result;
}

/**
 * Builds a human-readable summary of work block schedules per day of week
 * to inject into the AI prompt. This ensures SofLIA respects real work hours
 * when the deterministic plan is not used (e.g. user didn't specify days).
 *
 * Example output:
 * "HORARIO LABORAL DETECTADO EN CALENDARIO:
 *  - Lunes: trabajo de 09:00 a 17:00 → sesiones SOLO dentro de este horario
 *  - Martes: trabajo de 09:00 a 17:00 → sesiones SOLO dentro de este horario"
 */
function buildWorkBlockScheduleContext(
  calendarData: StudyPlannerCalendarDataMap,
): string {
  const DAY_NAMES_ES: Record<number, string> = {
    0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
    4: 'Jueves', 5: 'Viernes', 6: 'Sábado',
  };

  // Collect work block windows per day-of-week (use representative window)
  const workWindowByDow: Record<number, { start: string; end: string }> = {};

  for (const [, dayData] of Object.entries(calendarData)) {
    for (const event of dayData.events) {
      if (!isWorkBlockEvent(event)) continue;

      const rawStart = event.start ?? event.startTime;
      const rawEnd = event.end ?? event.endTime;
      if (!rawStart || !rawEnd) continue;

      const startDate = new Date(rawStart as string);
      const endDate = new Date(rawEnd as string);
      const dow = startDate.getDay();

      const startStr = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
      const endStr = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

      // Only set once per dow (first occurrence is enough for the constraint)
      if (!workWindowByDow[dow]) {
        workWindowByDow[dow] = { start: startStr, end: endStr };
      }
    }
  }

  const entries = Object.entries(workWindowByDow);
  if (entries.length === 0) return '';

  const lines = entries
    .sort(([dowA], [dowB]) => Number(dowA) - Number(dowB))
    .map(([dow, { start, end }]) => {
      const dayName = DAY_NAMES_ES[Number(dow)] ?? `Día ${dow}`;
      return `  - ${dayName}: trabajo de ${start} a ${end} → agenda sesiones SOLO dentro de este horario`;
    });

  return [
    '\n\nHORARIO LABORAL DETECTADO EN CALENDARIO (RESTRICCIÓN OBLIGATORIA):',
    'INSTRUCCIÓN CRÍTICA: Las sesiones de estudio DEBEN agendarse dentro del horario laboral.',
    'REGLA ESTRICTA PARA LA HORA DE FIN: La sesión de estudio DEBE TERMINAR antes de que termine tu jornada.',
    'Ejemplo: Si tu jornada termina a las 18:00 y la sesión dura 50 min, debe empezar a las 17:10 MÁXIMO.',
    'NUNCA agendes sesiones fuera del horario laboral (no antes del inicio ni después del fin).',
    ...lines,
    'Si necesitas ajustar las horas, mantente SIEMPRE dentro del bloque de trabajo del día.',
  ].join('\n');
}

/**
 * Builds a highly explicit context of real free slots mapped per date, so the LLM
 * doesn't blindly guess when the user is free, and actually sidesteps calendar meetings.
 */
function buildFreeSlotsContext(calendarData: StudyPlannerCalendarDataMap): string {
  const DAY_NAMES_ES: Record<number, string> = {
    0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
    4: 'Jueves', 5: 'Viernes', 6: 'Sábado',
  };

  const lines = [];
  // Take only the next 7-10 available days to avoid context bloating
  let daysProcessed = 0;
  for (const [dateStr, dayData] of Object.entries(calendarData).sort((a, b) => a[0].localeCompare(b[0]))) {
    if (!dayData.availability || dayData.availability.freeSlots.length === 0) continue;
    if (daysProcessed >= 10) break;

    const dateObj = new Date(dateStr + 'T12:00:00Z');
    const dayName = DAY_NAMES_ES[dateObj.getDay()] ?? dateStr;

    const slotStrings = dayData.availability.freeSlots.map(slot => {
       const startH = slot.startHour.toString().padStart(2, '0');
       const startM = slot.startMinute.toString().padStart(2, '0');
       const endH = slot.endHour.toString().padStart(2, '0');
       const endM = slot.endMinute.toString().padStart(2, '0');
       return `${startH}:${startM}-${endH}:${endM}`;
    });
    
    lines.push(`  - ${dayName} ${dateStr}: ${slotStrings.join(', ')}`);
    daysProcessed++;
  }

  if (lines.length === 0) return '';
  return [
    '\n\nHUECOS LIBRES REALES (CALENDARIO):',
    'El analizador encontró los siguientes espacios 100% libres (ya evitan reuniones, descansos y fuera-de-jornada):',
    'INSTRUCCIÓN CRÍTICA: Acomoda las lecciones SIEMPRE dentro de estos espacios exactos.',
    ...lines,
  ].join('\n');
}

// ---------------------------------------------------------------------------

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
  /** Calendar events by day — used to derive real work-block start times. */
  calendarData?: StudyPlannerCalendarDataMap | null;
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

const DOW_TO_PLANNER_NAME: Record<number, string> = {
  0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles',
  4: 'jueves', 5: 'viernes', 6: 'sabado',
};

/**
 * Returns the distinct days-of-week (as planner day names) that have at least
 * one work block event in the calendar data.
 */
function deriveWorkBlockDaysFromCalendar(
  calendarData: StudyPlannerCalendarDataMap,
): string[] {
  const dowSet = new Set<number>();
  for (const [, dayData] of Object.entries(calendarData)) {
    for (const event of dayData.events) {
      if (!isWorkBlockEvent(event)) continue;
      const rawStart = event.start ?? event.startTime;
      if (!rawStart) continue;
      dowSet.add(new Date(rawStart as string).getDay());
    }
  }
  return [...dowSet]
    .sort()
    .map((dow) => DOW_TO_PLANNER_NAME[dow])
    .filter(Boolean);
}

async function buildDeterministicPlanContext(
  params: Pick<
    BuildStudyPlannerChatRequestContextParams,
    'assignedCourses' | 'lessons' | 'message' | 'studyApproach' | 'calendarData'
  > & { explicitSessionMinutes?: number | null; resolvedCourseIds?: string[] },
): Promise<DeterministicPlanContextResult> {
  let uniqueDays = detectPlannerDays(params.message);

  // When the user didn't specify days but we have calendar data with work blocks,
  // fall back to the days that have work blocks in the calendar.
  if (uniqueDays.length === 0 && params.calendarData) {
    uniqueDays = deriveWorkBlockDaysFromCalendar(params.calendarData);
  }

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

  // Derive real work-block start and end times from calendar data when available
  const calendarStartTimesByDay = params.calendarData
    ? deriveCalendarStartTimesByDay(params.calendarData)
    : undefined;
  const calendarEndTimesByDay = params.calendarData
    ? deriveCalendarEndTimesByDay(params.calendarData)
    : undefined;

  const availabilityMap: Record<string, import('../types/calendar-integration.types').CalendarAvailability> = {};
  if (params.calendarData) {
    for (const [dateStr, dayData] of Object.entries(params.calendarData)) {
      if (dayData.availability) availabilityMap[dateStr] = dayData.availability;
    }
  }

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
        calendarStartTimesByDay,
        calendarEndTimesByDay,
        availabilityMap,
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
        'INSTRUCCION CRITICA PARA SofLIA:',
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
      'INSTRUCCION OBLIGATORIA PARA SofLIA:',
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

  // Resolve effective calendar data: use savedCalendarData when available, otherwise
  // fetch fresh from the server. This eliminates the timing race where savedCalendarData
  // is null because analyzeCalendarAndSuggest (setTimeout 2s) hasn't completed yet when
  // the user sends their first planning message.
  const effectiveCalendarData: StudyPlannerCalendarDataMap | null =
    params.calendarData ??
    (params.connectedCalendar ? await fetchCalendarEventsAsDataMap() : null);

  const deterministicContext = await buildDeterministicPlanContext({
    message: params.message,
    lessons: filteredLessons,
    assignedCourses: params.assignedCourses,
    studyApproach: params.studyApproach,
    explicitSessionMinutes: explicitDuration,
    resolvedCourseIds,
    calendarData: effectiveCalendarData,
  });

  // Inject real work-block schedule constraints so SofLIA respects actual work hours
  // even when the deterministic plan is not used (e.g. user didn't specify days).
  const workBlockContext = effectiveCalendarData
    ? buildWorkBlockScheduleContext(effectiveCalendarData)
    : '';
    
  const freeSlotsContext = effectiveCalendarData
    ? buildFreeSlotsContext(effectiveCalendarData)
    : '';

  const finalStudyPlannerContext = deterministicContext.blockPlanGeneration
    ? `SISTEMA: INFORMACION DE LECCIONES OCULTA POR INSUFICIENCIA DE HORARIO.\n${deterministicContext.preCalculatedPlanContext}`
    : `LECCIONES PENDIENTES (${filteredPendingCount} total):\n${lessonsContext}\n\nCALENDARIO: ${params.connectedCalendar ? `Conectado (${params.connectedCalendar})` : 'No conectado'}${freeSlotsContext}${workBlockContext}${dueDateContext}${deterministicContext.preCalculatedPlanContext}${existingPlanContext}`;

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
    throw new Error(`Error al comunicarse con SofLIA: ${response.status} ${response.statusText}. ${errorText}`);
  }

  const payload = (await response.json()) as StudyPlannerChatRequestResult;

  return {
    response: payload.response,
    conversationId: payload.conversationId,
  };
}
