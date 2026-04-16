import {
  ensureLessonDistributionIdentity,
  parsePlannerDateString,
  parsePlannerTimeString,
  sortLessonDistributions,
} from './lesson-distribution.service';
import type {
  StudyPlannerScheduledLesson,
  StudyPlannerStoredLessonDistribution,
} from '../types/planner-schedule.types';

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;
const MONTH_ABBREVIATIONS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;
const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'] as const;
const MONTH_PATTERN = `${MONTH_NAMES.join('|')}|${MONTH_ABBREVIATIONS.join('|')}`;
const DAY_PATTERN = 'lunes|martes|miercoles|jueves|viernes|sabado|domingo';

function normalizeComparableText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getDayName(date: Date): string {
  return DAY_NAMES[date.getDay()];
}

function getScheduleDetectionPattern(): RegExp {
  return new RegExp(
    `(?:${DAY_PATTERN})\\s+\\d{1,2}|\\d{1,2}\\s*(?:de\\s+)?(?:${MONTH_PATTERN})|\\d{1,2}[\\/.\\-]\\d{1,2}(?:[\\/.\\-]\\d{4})?|\\d{1,2}(?::\\d{2})?\\s*(?:a\\.?\\s*m\\.?|p\\.?\\s*m\\.?|am|pm)?\\s*(?:-|a|hasta)\\s*\\d{1,2}(?::\\d{2})?`,
    'i'
  );
}

function parseDateFromLine(line: string, contextDate?: Date): { dateStr: string; dayName: string } | null {
  const normalized = normalizeComparableText(line);
  if (normalized.startsWith('semana')) {
    return null;
  }
  const parsed = parsePlannerDateString(normalized, contextDate);

  if (!parsed) {
    return null;
  }

  return {
    dateStr: buildIsoDate(parsed),
    dayName: getDayName(parsed),
  };
}

function parseTimeRangeFromLine(line: string): { startTime: string; endTime: string } | null {
  const normalized = normalizeComparableText(line);
  const rangeMatch = normalized.match(
    /(?:a\s+las\s+|de\s+)?(\d{1,2}(?::\d{2})?\s*(?:a\.?\s*m\.?|p\.?\s*m\.?|am|pm)?)\s*(?:-|a|hasta)\s*(\d{1,2}(?::\d{2})?\s*(?:a\.?\s*m\.?|p\.?\s*m\.?|am|pm)?)/i
  );

  if (!rangeMatch) {
    return null;
  }

  const start = parsePlannerTimeString(rangeMatch[1]);
  const end = parsePlannerTimeString(rangeMatch[2]);

  if (!start || !end) {
    return null;
  }

  return {
    startTime: `${String(start.hours).padStart(2, '0')}:${String(start.minutes).padStart(2, '0')}`,
    endTime: `${String(end.hours).padStart(2, '0')}:${String(end.minutes).padStart(2, '0')}`,
  };
}

function extractLessonFromLine(rawLine: string): StudyPlannerScheduledLesson | null {
  const normalized = normalizeComparableText(rawLine);
  if (!normalized) {
    return null;
  }

  if (
    normalized.includes('total agrupado') ||
    normalized.includes('sesion de estudio') ||
    normalized.includes('sesiones de estudio') ||
    normalized.includes('sin lecciones asignadas') ||
    normalized.startsWith('resumen') ||
    normalized.startsWith('verificacion') ||
    normalized.includes('total de lecciones') ||
    normalized.includes('semanas de estudio') ||
    normalized.includes('fecha de finalizacion') ||
    normalized.includes('te parece bien') ||
    normalized.includes('horario exacto')
  ) {
    return null;
  }

  const patterns = [
    /^(?:[-*•]\s*)?leccion\s+(\d+(?:\.\d+)*)[:.\-]?\s*(.+)$/i,
    /^(?:[-*•]\s*)?(\d+(?:\.\d+)*)[:.\-]\s*(.+)$/i,
    /^(?:[-*•]\s+)(.+)$/i,
    /^(.+?)(?:\(|\[|-)?\s*(\d+)\s*(?:min|minuto|minutos)(?:\)|\])?\s*$/i
  ];

  for (const pattern of patterns) {
    const match = rawLine.trim().match(pattern);
    if (!match) {
      continue;
    }

    const isNonNumericPattern = pattern === patterns[2] || pattern === patterns[3];
    const lessonOrderIndex = isNonNumericPattern ? 0 : Number.parseInt(match[1], 10) || 0;
    let lessonTitle = (isNonNumericPattern ? match[1] : match[2]).trim();

    let durationMinutes = 0;
    if (pattern === patterns[3]) {
      durationMinutes = Number.parseInt(match[2], 10);
    } else {
      const durationMatch = lessonTitle.match(/(?:\(|\[|-)?\s*(\d+)\s*(?:min|minuto|minutos)(?:\)|\])?/i);
      if (durationMatch) {
        durationMinutes = Number.parseInt(durationMatch[1], 10);
        lessonTitle = lessonTitle.replace(durationMatch[0], '').trim();
      }
    }

    const comparableTitle = normalizeComparableText(lessonTitle);

    if (!comparableTitle || comparableTitle.length <= 3) {
      return null;
    }

    if (/^leccion\s+\d+(?:\.\d+)?[:.\-]?\s*$/.test(comparableTitle)) {
      return null;
    }

    return {
      courseTitle: 'Curso',
      lessonTitle,
      lessonOrderIndex,
      durationMinutes,
    };
  }

  return null;
}

function flushCurrentSchedule(
  schedules: StudyPlannerStoredLessonDistribution[],
  currentSchedule: StudyPlannerStoredLessonDistribution | null
): StudyPlannerStoredLessonDistribution | null {
  if (!currentSchedule) {
    return null;
  }

  schedules.push({
    ...currentSchedule,
    lessons: [...currentSchedule.lessons],
  });

  return null;
}

export function parseLiaResponseToSchedules(text: string): StudyPlannerStoredLessonDistribution[] {
  if (!text || !getScheduleDetectionPattern().test(normalizeComparableText(text))) {
    return [];
  }

  const schedules: StudyPlannerStoredLessonDistribution[] = [];
  const lines = text.split('\n');
  let currentDate: { dateStr: string; dayName: string } | null = null;
  let currentSchedule: StudyPlannerStoredLessonDistribution | null = null;
  let currentContextDate: Date | undefined;

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      return;
    }

    // Stop processing if we hit the summary section
    if (
      trimmedLine.startsWith('---') ||
      trimmedLine.toLowerCase().includes('resumen del plan') ||
      trimmedLine.toLowerCase().includes('resumen:')
    ) {
      currentSchedule = flushCurrentSchedule(schedules, currentSchedule);
      return;
    }

    const normalizedLine = normalizeComparableText(trimmedLine);
    if (normalizedLine.startsWith('semana')) {
      const parsed = parsePlannerDateString(normalizedLine);
      if (parsed) {
        currentContextDate = parsed;
      }
      return;
    }

    const nextDate = parseDateFromLine(trimmedLine, currentContextDate);
    const nextTimeRange = parseTimeRangeFromLine(trimmedLine);

    // If there's a time range, strip it to check if a lesson is on the same line
    let lineForLesson = trimmedLine;
    if (nextTimeRange) {
      const timeRegex = /(?:(?:a\s+las\s+|de\s+)?(\d{1,2}(?::\d{2})?\s*(?:a\.?\s*m\.?|p\.?\s*m\.?|am|pm)?)\s*(?:-|a|hasta)+\s*(\d{1,2}(?::\d{2})?\s*(?:a\.?\s*m\.?|p\.?\s*m\.?|am|pm)?))/i;
      const tMatch = trimmedLine.match(timeRegex);
      if (tMatch) {
        const stripped = trimmedLine.replace(tMatch[0], '').replace(/^[:\-\s]+/, '').trim();
        lineForLesson = stripped ? `- ${stripped}` : '';
      }
    }

    if (nextDate && nextTimeRange) {
      currentSchedule = flushCurrentSchedule(schedules, currentSchedule);
      currentDate = nextDate;
      currentSchedule = {
        clientReferenceId: '',
        dateStr: nextDate.dateStr,
        dayName: nextDate.dayName,
        startTime: nextTimeRange.startTime,
        endTime: nextTimeRange.endTime,
        lessons: [],
      };
    } else if (nextDate) {
      currentSchedule = flushCurrentSchedule(schedules, currentSchedule);
      currentDate = nextDate;
      return;
    } else if (nextTimeRange && currentDate) {
      currentSchedule = flushCurrentSchedule(schedules, currentSchedule);
      currentSchedule = {
        clientReferenceId: '',
        dateStr: currentDate.dateStr,
        dayName: currentDate.dayName,
        startTime: nextTimeRange.startTime,
        endTime: nextTimeRange.endTime,
        lessons: [],
      };
    }

    if (!currentSchedule || !lineForLesson) {
      return;
    }

    const lesson = extractLessonFromLine(lineForLesson);
    if (lesson) {
      currentSchedule.lessons.push(lesson);
    }
  });

  flushCurrentSchedule(schedules, currentSchedule);

  return sortLessonDistributions(
    schedules.filter(
      schedule =>
        Boolean(schedule.dateStr) &&
        Boolean(schedule.startTime) &&
        Boolean(schedule.endTime)
    ).map((schedule) => ensureLessonDistributionIdentity(schedule))
  );
}
