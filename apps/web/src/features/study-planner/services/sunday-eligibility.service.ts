import type { StudyPlannerCalendarEventLike } from '../types/planner-schedule.types';
import { isWorkBlock } from './calendar-availability.service';

const SUNDAY_DAY_INDEX = 0;

const SUNDAY_TOKEN_PATTERN = /\b(domingo|dom)\b/i;
const SUNDAY_RANGE_PATTERN =
  /\b(?:lunes|martes|miercoles|jueves|viernes|sabado)\s+(?:a|al|hasta)\s+domingo\b/i;

const SUNDAY_NEGATIVE_PATTERNS = [
  /\bno\s+(?:quiero|puedo|usar|uses|utilices|agendes|program(?:es|ar)|pongas|muevas|incluyas).*?\bdomingo\b/i,
  /\bdomingo\b.*?\bno\s+(?:me\s+)?(?:sirve|funciona|conviene)\b/i,
  /\bsin\s+domingo\b/i,
  /\bexcepto\s+domingo\b/i,
] as const;

const SUNDAY_POSITIVE_PATTERNS = [
  SUNDAY_RANGE_PATTERN,
  /\b(?:estudiar|agendar|programar|poner|mover|muevelo|mueveme|cambiar|cambiame|usar|usa|utiliza|incluye|puedes usar).*?\bdomingo\b/i,
  /\bdomingo\b.*?\b(?:esta bien|me sirve|me funciona|puedo|quiero|prefiero|tambien|tambien puedo|por la manana|por la tarde|por la noche)\b/i,
  /\b(?:aunque sea|aunque no trabaje|aunque no haya trabajo|aunque sea mi descanso|en mi descanso).*?\bdomingo\b/i,
] as const;

function normalizePlannerText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toDate(value: string | Date | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toCalendarEvent(event: StudyPlannerCalendarEventLike) {
  const start = event.start || event.startTime;
  const end = event.end || event.endTime;

  return {
    id: `${event.title || event.summary || 'Evento'}-${String(start)}-${String(end)}`,
    title: event.title || event.summary || '',
    description: event.description,
    startTime: String(start),
    endTime: String(end),
    isAllDay: Boolean(event.isAllDay),
    isRecurring: false,
    status: 'status' in event && event.status === 'cancelled' ? 'cancelled' as const : 'confirmed' as const,
  };
}

export function isSundayDate(date: Date): boolean {
  return date.getDay() === SUNDAY_DAY_INDEX;
}

export function userExplicitlyAllowsSunday(message: string): boolean {
  const normalized = normalizePlannerText(message || '');

  if (!SUNDAY_TOKEN_PATTERN.test(normalized)) {
    return false;
  }

  if (SUNDAY_NEGATIVE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return false;
  }

  return SUNDAY_POSITIVE_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function hasSundayWorkBlock(events: StudyPlannerCalendarEventLike[]): boolean {
  return events.some((event) => {
    const start = toDate(event.start || event.startTime);

    return Boolean(
      start
      && isSundayDate(start)
      && isWorkBlock(toCalendarEvent(event)),
    );
  });
}

export function canUseSunday(params: {
  date: Date;
  events?: StudyPlannerCalendarEventLike[];
  userMessage?: string;
  hasWorkBlock?: boolean;
}): boolean {
  if (!isSundayDate(params.date)) {
    return true;
  }

  if (params.hasWorkBlock || hasSundayWorkBlock(params.events || [])) {
    return true;
  }

  return userExplicitlyAllowsSunday(params.userMessage || '');
}

export function filterUnauthorizedSundayDays<T extends { date: Date; events?: StudyPlannerCalendarEventLike[]; hasWorkBlock?: boolean }>(
  days: T[],
  userMessage?: string,
): T[] {
  return days.filter((day) =>
    canUseSunday({
      date: day.date,
      events: day.events,
      hasWorkBlock: day.hasWorkBlock,
      userMessage,
    }),
  );
}

