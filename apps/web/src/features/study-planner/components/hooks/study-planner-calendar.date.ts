import {
  endOfDay,
  format,
  isSameDay,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';

import type { CalendarDate } from '../calendar/types';

function normalizeCalendarDate(value: CalendarDate | string): CalendarDate {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  const parsedDate = parseISO(value);
  return Number.isNaN(parsedDate.getTime()) ? new Date(value) : parsedDate;
}

export function formatCalendarLabel(
  value: CalendarDate | string,
  template: string
): string {
  const date = normalizeCalendarDate(value);
  return isValid(date) ? format(date, template, { locale: es }) : '';
}

export function formatCalendarTime(value: CalendarDate | string): string {
  return formatCalendarLabel(value, 'h:mm aaa');
}

export function toDateTimeLocalValue(value: string): string {
  if (!value) {
    return '';
  }

  return formatCalendarLabel(value, "yyyy-MM-dd'T'HH:mm");
}

export function toDateValue(value: string): string {
  if (!value) {
    return '';
  }

  return formatCalendarLabel(value, 'yyyy-MM-dd');
}

export function fromDateTimeLocalValue(value: string): string {
  if (!value) {
    return '';
  }

  return normalizeCalendarDate(value).toISOString();
}

export function fromDateOnlyStartValue(value: string): string {
  if (!value) {
    return '';
  }

  return startOfDay(normalizeCalendarDate(value)).toISOString();
}

export function fromDateOnlyEndValue(value: string): string {
  if (!value) {
    return '';
  }

  return endOfDay(normalizeCalendarDate(value)).toISOString();
}

export function isSameCalendarDay(
  left: CalendarDate | string,
  right: CalendarDate | string
): boolean {
  return isSameDay(normalizeCalendarDate(left), normalizeCalendarDate(right));
}

export function toCalendarDate(value: CalendarDate | string): CalendarDate {
  return normalizeCalendarDate(value);
}
