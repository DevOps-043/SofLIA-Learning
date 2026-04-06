import type {
  StudyPlannerComputedLessonDistribution,
  StudyPlannerScheduledLesson,
  StudyPlannerStoredLessonDistribution,
} from '../types/planner-schedule.types';
import type { OrganizationHoliday } from './organization-planner-config.service';

const HOLIDAY_DATE_PARTS = ['-01-01', '-12-25', '-05-01', '-09-16', '-11-20'];
const MONTH_MAP: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
  ene: 0,
  feb: 1,
  mar: 2,
  abr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dic: 11,
};
const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'] as const;

function normalizeComparableText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getDayName(date: Date): string {
  return DAY_NAMES[date.getDay()];
}

function getDistributionKey(item: Pick<StudyPlannerStoredLessonDistribution, 'dateStr' | 'startTime'>): string {
  return `${item.dateStr}_${item.startTime}`;
}

function isInformativeLessonTitle(title: string): boolean {
  const normalized = normalizeComparableText(title);
  if (!normalized || normalized.length <= 3) {
    return false;
  }

  return !/^leccion\s*\d+(?:\.\d+)?[:.\-]?\s*$/.test(normalized) && normalized !== 'sin lecciones asignadas';
}

function sanitizeScheduledLesson(
  lesson: Partial<StudyPlannerScheduledLesson> | null | undefined
): StudyPlannerScheduledLesson | null {
  if (!lesson?.lessonTitle || typeof lesson.lessonTitle !== 'string') {
    return null;
  }

  const lessonTitle = lesson.lessonTitle.trim();
  if (!isInformativeLessonTitle(lessonTitle)) {
    return null;
  }

  return {
    courseTitle: lesson.courseTitle?.trim() || 'Curso',
    lessonTitle,
    lessonOrderIndex: typeof lesson.lessonOrderIndex === 'number' && lesson.lessonOrderIndex > 0
      ? lesson.lessonOrderIndex
      : 0,
    durationMinutes: typeof lesson.durationMinutes === 'number' && lesson.durationMinutes >= 0
      ? lesson.durationMinutes
      : 0,
    moduleTitle: lesson.moduleTitle?.trim() || undefined,
    moduleOrderIndex: typeof lesson.moduleOrderIndex === 'number'
      ? lesson.moduleOrderIndex
      : undefined,
  };
}

function chooseLessonsToKeep(
  existing: StudyPlannerStoredLessonDistribution | undefined,
  incoming: StudyPlannerStoredLessonDistribution
): StudyPlannerScheduledLesson[] {
  if (existing?.lessons.length) {
    return existing.lessons;
  }

  return incoming.lessons;
}

export function parsePlannerDateString(dateStr: string): Date | null {
  const raw = dateStr.trim();
  const normalized = normalizeComparableText(raw);

  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }

  const slashMatch = normalized.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (slashMatch) {
    return new Date(Number(slashMatch[3]), Number(slashMatch[2]) - 1, Number(slashMatch[1]));
  }

  const monthMatch = normalized.match(/(\d{1,2})\s*(?:de\s+)?([a-z]+)(?:\s+de\s+(\d{4}))?/i);
  if (monthMatch) {
    const month = MONTH_MAP[monthMatch[2]];
    if (month !== undefined) {
      const day = Number(monthMatch[1]);
      const year = monthMatch[3] ? Number(monthMatch[3]) : new Date().getFullYear();
      return new Date(year, month, day);
    }
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parsePlannerTimeString(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr || typeof timeStr !== 'string') {
    return null;
  }

  const normalized = normalizeComparableText(timeStr).replace(/\s+/g, '');
  const match = normalized.match(/(\d{1,2})(?::(\d{2}))?([ap]m?)?/i);
  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? '0');
  const period = match[3] ?? '';

  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes < 0 || minutes > 59) {
    return null;
  }

  if (period.startsWith('p') && hours < 12) {
    hours += 12;
  } else if (period.startsWith('a') && hours === 12) {
    hours = 0;
  }

  if (hours < 0 || hours > 23) {
    return null;
  }

  return { hours, minutes };
}

export function formatPlannerTime24h(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function isHolidayDistributionDate(
  dateStr: string,
  organizationHolidays?: OrganizationHoliday[],
): boolean {
  // Check national holidays
  if (HOLIDAY_DATE_PARTS.some(part => dateStr.includes(part))) {
    return true;
  }

  const parsed = parsePlannerDateString(dateStr);
  if (!parsed) {
    return false;
  }

  const isoDate = buildIsoDate(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  if (HOLIDAY_DATE_PARTS.some(part => isoDate.includes(part))) {
    return true;
  }

  // Check organizational holidays (B2B)
  if (organizationHolidays && organizationHolidays.length > 0) {
    return organizationHolidays.some((h) => h.date === isoDate);
  }

  return false;
}

export function filterHolidayLessonDistributions(
  distributions: StudyPlannerStoredLessonDistribution[],
  organizationHolidays?: OrganizationHoliday[],
): StudyPlannerStoredLessonDistribution[] {
  return distributions.filter(item => !isHolidayDistributionDate(item.dateStr, organizationHolidays));
}

export function sortLessonDistributions(
  distributions: StudyPlannerStoredLessonDistribution[]
): StudyPlannerStoredLessonDistribution[] {
  return [...distributions].sort((left, right) => {
    const leftDate = parsePlannerDateString(left.dateStr)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightDate = parsePlannerDateString(right.dateStr)?.getTime() ?? Number.MAX_SAFE_INTEGER;

    if (leftDate !== rightDate) {
      return leftDate - rightDate;
    }

    return left.startTime.localeCompare(right.startTime);
  });
}

export function serializeLessonDistributionForStorage(
  lessonDistribution: StudyPlannerComputedLessonDistribution[]
): StudyPlannerStoredLessonDistribution[] {
  return lessonDistribution
    .map(item => {
      const lessons = item.lessons
        .map(sanitizeScheduledLesson)
        .filter((lesson): lesson is StudyPlannerScheduledLesson => lesson !== null);

      if (lessons.length === 0) {
        return null;
      }

      const parsedDate = parsePlannerDateString(item.slot.dateStr);
      const dayName = item.slot.dayName || (parsedDate ? getDayName(parsedDate) : 'Lunes');

      return {
        dateStr: item.slot.dateStr,
        dayName,
        startTime: formatPlannerTime24h(item.slot.start),
        endTime: formatPlannerTime24h(item.slot.end),
        lessons,
      };
    })
    .filter((item): item is StudyPlannerStoredLessonDistribution => item !== null);
}

export function mergeLessonDistributions(
  existing: StudyPlannerStoredLessonDistribution[],
  incoming: StudyPlannerStoredLessonDistribution[],
  options?: { replaceExisting?: boolean }
): StudyPlannerStoredLessonDistribution[] {
  const existingMap = new Map(existing.map(item => [getDistributionKey(item), item]));
  const incomingMap = new Map(incoming.map(item => [getDistributionKey(item), item]));

  if (options?.replaceExisting) {
    return sortLessonDistributions(
      incoming.map(item => {
        const current = existingMap.get(getDistributionKey(item));
        return {
          ...item,
          lessons: chooseLessonsToKeep(current, item),
        };
      })
    );
  }

  const merged = [...existing];

  incoming.forEach(item => {
    const key = getDistributionKey(item);
    const index = merged.findIndex(current => getDistributionKey(current) === key);
    const current = existingMap.get(key);
    const nextItem = {
      ...item,
      lessons: chooseLessonsToKeep(current, item),
    };

    if (index >= 0) {
      merged[index] = nextItem;
      return;
    }

    if (!incomingMap.has(key)) {
      return;
    }

    merged.push(nextItem);
  });

  return sortLessonDistributions(merged);
}

export function shouldReplaceLessonDistribution(params: {
  liaResponse: string;
  extractedSchedulesCount: number;
  existingSchedulesCount: number;
  isAddingSchedules: boolean;
  isConfirmingSchedules: boolean;
}): boolean {
  const lowerResponse = params.liaResponse.toLowerCase();
  const looksLikeSummary =
    lowerResponse.includes('resumen') ||
    lowerResponse.includes('distribucion') ||
    lowerResponse.includes('todos los horarios') ||
    lowerResponse.includes('horarios:') ||
    lowerResponse.includes('sesiones programadas') ||
    lowerResponse.includes('plan de estudios') ||
    lowerResponse.includes('sesiones generadas') ||
    (params.extractedSchedulesCount >= 5 && params.existingSchedulesCount > 0);

  return looksLikeSummary || params.isAddingSchedules || params.isConfirmingSchedules;
}
