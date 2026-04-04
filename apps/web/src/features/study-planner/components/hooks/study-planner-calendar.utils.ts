import {
  addDays,
  differenceInMinutes,
  endOfDay,
  endOfWeek,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  setHours,
  setMinutes,
  setSeconds,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

import type { CalendarDate } from '../calendar/types';
import {
  DEFAULT_EVENT_COLOR,
  DEFAULT_EVENT_FORM,
} from './study-planner-calendar.constants';
import type {
  CalendarEvent,
  StudyPlannerCalendarEventForm,
  StudyPlannerCalendarEventPosition,
  StudyPlannerCalendarMonthDay,
  StudyPlannerCalendarWeekRange,
  ViewType,
} from './study-planner-calendar.types';
import { toCalendarDate } from './study-planner-calendar.date';

export function getEventColor(event: CalendarEvent): string {
  if (event.color) {
    return event.color;
  }
  if (event.source === 'study_session') {
    return '#8E24AA';
  }
  if (event.provider === 'google') {
    return '#0066CC';
  }
  if (event.provider === 'microsoft') {
    return '#0078D4';
  }
  return DEFAULT_EVENT_COLOR;
}

export function buildWeekRange(
  currentDate: CalendarDate
): StudyPlannerCalendarWeekRange {
  return {
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 }),
  };
}

export function buildWeekDays(currentDate: CalendarDate): CalendarDate[] {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function buildMonthDays(
  currentDate: CalendarDate,
  today: CalendarDate
): StudyPlannerCalendarMonthDay[] {
  const monthStart = startOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);

    return {
      date,
      isCurrentMonth: isSameMonth(date, currentDate),
      isToday: isSameDay(date, today),
      dayNumber: date.getDate(),
    };
  });
}

export function resolveCalendarRange(
  currentDate: CalendarDate,
  view: ViewType
): { startDate: CalendarDate; endDate: CalendarDate } | null {
  if (view === 'month') {
    const startDate = startOfWeek(startOfMonth(currentDate), {
      weekStartsOn: 1,
    });

    return {
      startDate,
      endDate: addDays(startDate, 41),
    };
  }

  if (view === 'week') {
    const weekRange = buildWeekRange(currentDate);
    return {
      startDate: startOfDay(weekRange.start),
      endDate: endOfDay(weekRange.end),
    };
  }

  if (view === 'day') {
    return {
      startDate: startOfDay(currentDate),
      endDate: endOfDay(currentDate),
    };
  }

  return null;
}

export function buildEventFormFromEvent(
  event: CalendarEvent
): StudyPlannerCalendarEventForm {
  return {
    title: event.title,
    description: event.description || '',
    start: event.start,
    end: event.end,
    location: event.location || '',
    isAllDay: event.isAllDay || false,
    color: event.color || '#0066CC',
  };
}

export function buildDefaultEventFormForDate(
  currentDate: CalendarDate
): StudyPlannerCalendarEventForm {
  const baseDate = startOfDay(currentDate);
  const defaultStart = setSeconds(
    setMinutes(setHours(baseDate, 9), 0),
    0
  );
  const defaultEnd = setSeconds(
    setMinutes(setHours(baseDate, 10), 0),
    0
  );

  return {
    ...DEFAULT_EVENT_FORM,
    start: defaultStart.toISOString(),
    end: defaultEnd.toISOString(),
  };
}

export function getEventsForDay(
  events: CalendarEvent[],
  date: CalendarDate
): CalendarEvent[] {
  return events.filter((event) => {
    const eventStart = toCalendarDate(event.start);
    const eventEnd = toCalendarDate(event.end);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    if (event.isAllDay) {
      const eventStartDay = startOfDay(eventStart);
      const eventEndDay = startOfDay(eventEnd);
      return (
        (isSameDay(date, eventStartDay) || isAfter(date, eventStartDay))
        && (isSameDay(date, eventEndDay) || isBefore(date, eventEndDay))
      );
    }

    return (
      (isSameDay(eventStart, dayEnd) || isBefore(eventStart, dayEnd))
      && (isSameDay(eventEnd, dayStart) || isAfter(eventEnd, dayStart))
    );
  });
}

export function getEventPosition(
  event: CalendarEvent,
  date: CalendarDate
): StudyPlannerCalendarEventPosition | null {
  if (event.isAllDay) {
    return { top: 0, height: 16, isAllDay: true };
  }

  const eventStart = toCalendarDate(event.start);
  const eventEnd = toCalendarDate(event.end);
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const overlapsDay = (
    (isSameDay(eventStart, dayEnd) || isBefore(eventStart, dayEnd))
    && (isSameDay(eventEnd, dayStart) || isAfter(eventEnd, dayStart))
  );

  if (!overlapsDay) {
    return null;
  }

  const visibleStart = isBefore(eventStart, dayStart) ? dayStart : eventStart;
  const visibleEnd = isAfter(eventEnd, dayEnd) ? dayEnd : eventEnd;
  const startMinutes =
    visibleStart.getHours() * 60 + visibleStart.getMinutes();
  const durationMinutes = Math.max(
    differenceInMinutes(visibleEnd, visibleStart),
    0
  );

  return {
    top: (startMinutes / 60) * 64,
    height: Math.max((durationMinutes / 60) * 64, 20),
    isAllDay: false,
  };
}

export function normalizeCalendarMutationError(errorMessage?: string): string {
  const fallbackMessage = errorMessage || 'Error al guardar el evento';

  if (
    fallbackMessage.includes('insufficient authentication scopes')
    || (
      fallbackMessage.includes('insufficient')
      && fallbackMessage.includes('scopes')
    )
  ) {
    return 'Permisos insuficientes. Por favor, reconecta tu calendario de Google con permisos de escritura.';
  }

  return fallbackMessage;
}
