import type { StudyPlannerStoredLessonDistribution } from '../types/planner-schedule.types';
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

export function normalizeComparableText(value: string): string {
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

export function getPlannerDayName(date: Date): string {
  return DAY_NAMES[date.getDay()];
}

export function parsePlannerDateString(dateStr: string, contextDate?: Date): Date | null {
  const raw = dateStr.trim();
  const normalized = normalizeComparableText(raw);

  const isoMatch = normalized.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }

  const slashMatch = normalized.match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
  if (slashMatch) {
    return new Date(Number(slashMatch[3]), Number(slashMatch[2]) - 1, Number(slashMatch[1]));
  }

  const monthMatch = normalized.match(/(\d{1,2})\s*(?:de\s+)?([a-z]+)(?:\s+de\s+(\d{4}))?/i);
  if (monthMatch) {
    const month = MONTH_MAP[monthMatch[2]];
    if (month !== undefined) {
      const day = Number(monthMatch[1]);
      const year = monthMatch[3] ? Number(monthMatch[3]) : (contextDate ? contextDate.getFullYear() : new Date().getFullYear());
      return new Date(year, month, day);
    }
  }

  const partialDateMatch = normalized.match(/(?:lunes|martes|miercoles|jueves|viernes|sabado|domingo)\s+(\d{1,2})/i);
  if (partialDateMatch && contextDate) {
    const day = Number(partialDateMatch[1]);
    return new Date(contextDate.getFullYear(), contextDate.getMonth(), day);
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
