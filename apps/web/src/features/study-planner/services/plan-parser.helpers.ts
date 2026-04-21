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

export function normalizeComparableText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasScheduleShape(text: string): boolean {
  return getScheduleDetectionPattern().test(normalizeComparableText(text));
}

export function parseDateFromLine(line: string, contextDate?: Date): { dateStr: string; dayName: string } | null {
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
    dayName: DAY_NAMES[parsed.getDay()],
  };
}

export function parseTimeRangeFromLine(line: string): { startTime: string; endTime: string } | null {
  const normalized = normalizeComparableText(line);
  const rangeMatch = normalized.match(
    /(?:a\s+las\s+|de\s+)?(\d{1,2}(?::\d{2})?\s*(?:a\.?\s*m\.?|p\.?\s*m\.?|am|pm)?)\s*(?:-|a|hasta)\s*(\d{1,2}(?::\d{2})?\s*(?:a\.?\s*m\.?|p\.?\s*m\.?|am|pm)?)/i,
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

export function stripTimeRangeFromLine(line: string): string {
  const timeRegex = /(?:(?:a\s+las\s+|de\s+)?(\d{1,2}(?::\d{2})?\s*(?:a\.?\s*m\.?|p\.?\s*m\.?|am|pm)?)\s*(?:-|a|hasta)+\s*(\d{1,2}(?::\d{2})?\s*(?:a\.?\s*m\.?|p\.?\s*m\.?|am|pm)?))/i;
  const match = line.match(timeRegex);

  if (!match) {
    return line;
  }

  const stripped = line.replace(match[0], '').replace(/^[:\-\s]+/, '').trim();
  return stripped ? `- ${stripped}` : '';
}

export function extractLessonFromLine(rawLine: string): StudyPlannerScheduledLesson | null {
  const normalized = normalizeComparableText(rawLine);
  if (!normalized || isNonLessonLine(normalized)) {
    return null;
  }

  const patterns = [
    /^(?:[-*â€¢]\s*)?leccion\s+(\d+(?:\.\d+)*)[:.\-]?\s*(.+)$/i,
    /^(?:[-*â€¢]\s*)?(\d+(?:\.\d+)*)[:.\-]\s*(.+)$/i,
    /^(?:[-*â€¢]\s+)(.+)$/i,
    /^(.+?)(?:\(|\[|-)?\s*(\d+)\s*(?:min|minuto|minutos)(?:\)|\])?\s*$/i,
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

    if (!isValidLessonTitle(lessonTitle)) {
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

export function flushCurrentSchedule(
  schedules: StudyPlannerStoredLessonDistribution[],
  currentSchedule: StudyPlannerStoredLessonDistribution | null,
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

export function finalizeParsedSchedules(
  schedules: StudyPlannerStoredLessonDistribution[],
): StudyPlannerStoredLessonDistribution[] {
  return sortLessonDistributions(
    schedules
      .filter((schedule) =>
        Boolean(schedule.dateStr) &&
        Boolean(schedule.startTime) &&
        Boolean(schedule.endTime),
      )
      .map((schedule) => ensureLessonDistributionIdentity(schedule)),
  );
}

function getScheduleDetectionPattern(): RegExp {
  return new RegExp(
    `(?:${DAY_PATTERN})\\s+\\d{1,2}|\\d{1,2}\\s*(?:de\\s+)?(?:${MONTH_PATTERN})|\\d{1,2}[\\/.\\-]\\d{1,2}(?:[\\/.\\-]\\d{4})?|\\d{1,2}(?::\\d{2})?\\s*(?:a\\.?\\s*m\\.?|p\\.?\\s*m\\.?|am|pm)?\\s*(?:-|a|hasta)\\s*\\d{1,2}(?::\\d{2})?`,
    'i',
  );
}

function buildIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isNonLessonLine(normalized: string): boolean {
  return (
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
  );
}

function isValidLessonTitle(lessonTitle: string): boolean {
  const comparableTitle = normalizeComparableText(lessonTitle);
  return Boolean(comparableTitle && comparableTitle.length > 3) &&
    !/^leccion\s+\d+(?:\.\d+)?[:.\-]?\s*$/.test(comparableTitle);
}
