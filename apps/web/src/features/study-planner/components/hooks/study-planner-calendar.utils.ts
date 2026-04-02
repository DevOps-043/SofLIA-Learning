import moment, { type Moment } from 'moment';

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

export function buildWeekRange(currentDate: Moment): StudyPlannerCalendarWeekRange {
  return {
    start: currentDate.clone().startOf('week'),
    end: currentDate.clone().endOf('week'),
  };
}

export function buildWeekDays(currentDate: Moment): Moment[] {
  const startOfWeek = currentDate.clone().startOf('week');
  return Array.from({ length: 7 }, (_, index) =>
    startOfWeek.clone().add(index, 'days')
  );
}

export function buildMonthDays(
  currentDate: Moment,
  today: Moment
): StudyPlannerCalendarMonthDay[] {
  const startOfMonth = currentDate.clone().startOf('month');
  const endOfMonth = currentDate.clone().endOf('month');
  const daysInMonth = currentDate.daysInMonth();
  const firstDayOfWeek = startOfMonth.day() === 0 ? 7 : startOfMonth.day();

  const days: StudyPlannerCalendarMonthDay[] = [];
  const daysFromPrevMonth = firstDayOfWeek - 1;

  for (let index = daysFromPrevMonth - 1; index >= 0; index -= 1) {
    const date = startOfMonth.clone().subtract(index + 1, 'days');
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      dayNumber: date.date(),
    });
  }

  for (let index = 1; index <= daysInMonth; index += 1) {
    const date = startOfMonth.clone().date(index);
    days.push({
      date,
      isCurrentMonth: true,
      isToday: date.isSame(today, 'day'),
      dayNumber: index,
    });
  }

  const remainingDays = 42 - days.length;
  for (let index = 1; index <= remainingDays; index += 1) {
    const date = endOfMonth.clone().add(index, 'days');
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      dayNumber: date.date(),
    });
  }

  return days;
}

export function resolveCalendarRange(
  currentDate: Moment,
  view: ViewType
): { startDate: Moment; endDate: Moment } | null {
  if (view === 'month') {
    const startOfMonth = currentDate.clone().startOf('month');
    const firstDayOfWeek = startOfMonth.day() === 0 ? 7 : startOfMonth.day();
    const daysFromPrevMonth = firstDayOfWeek - 1;
    const startDate = startOfMonth.clone().subtract(daysFromPrevMonth, 'days');

    return {
      startDate,
      endDate: startDate.clone().add(41, 'days'),
    };
  }

  if (view === 'week') {
    const weekRange = buildWeekRange(currentDate);
    return {
      startDate: weekRange.start.clone().startOf('day'),
      endDate: weekRange.end.clone().endOf('day'),
    };
  }

  if (view === 'day') {
    return {
      startDate: currentDate.clone().startOf('day'),
      endDate: currentDate.clone().endOf('day'),
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
  currentDate: Moment
): StudyPlannerCalendarEventForm {
  const defaultStart = currentDate.clone().hour(9).minute(0).second(0);
  const defaultEnd = currentDate.clone().hour(10).minute(0).second(0);

  return {
    ...DEFAULT_EVENT_FORM,
    start: defaultStart.toISOString(),
    end: defaultEnd.toISOString(),
  };
}

export function getEventsForDay(
  events: CalendarEvent[],
  date: Moment
): CalendarEvent[] {
  return events.filter((event) => {
    const eventStart = moment(event.start);
    const eventEnd = moment(event.end);
    const dayStart = date.clone().startOf('day');
    const dayEnd = date.clone().endOf('day');

    if (event.isAllDay) {
      const eventStartDay = eventStart.clone().startOf('day');
      const eventEndDay = eventEnd.clone().startOf('day');
      return (
        date.isSameOrAfter(eventStartDay, 'day')
        && date.isSameOrBefore(eventEndDay, 'day')
      );
    }

    return eventStart.isSameOrBefore(dayEnd) && eventEnd.isSameOrAfter(dayStart);
  });
}

export function getEventPosition(
  event: CalendarEvent,
  date: Moment
): StudyPlannerCalendarEventPosition | null {
  if (event.isAllDay) {
    return { top: 0, height: 16, isAllDay: true };
  }

  const eventStart = moment(event.start);
  const eventEnd = moment(event.end);

  if (!date.isSame(eventStart, 'day') && !date.isSame(eventEnd, 'day')) {
    const dayStart = date.clone().startOf('day');
    const dayEnd = date.clone().endOf('day');
    if (!(eventStart.isBefore(dayEnd) && eventEnd.isAfter(dayStart))) {
      return null;
    }
  }

  const startMinutes = eventStart.hour() * 60 + eventStart.minute();
  const endMinutes = eventEnd.hour() * 60 + eventEnd.minute();
  const durationMinutes = endMinutes - startMinutes;

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
