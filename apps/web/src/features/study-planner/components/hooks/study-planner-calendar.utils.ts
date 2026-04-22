import {
  addDays,
  endOfDay,
  endOfWeek,
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
  STUDY_PLANNER_WEEK_STARTS_ON,
} from './study-planner-calendar.constants';
import type {
  CalendarEvent,
  StudyPlannerCalendarEventForm,
  StudyPlannerCalendarMonthDay,
  StudyPlannerCalendarWeekRange,
  ViewType,
} from './study-planner-calendar.types';

export {
  getEventLayoutsForDay,
  getEventPosition,
  getEventsForDay,
} from './study-planner-calendar-layout.utils';

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
    start: startOfWeek(currentDate, {
      weekStartsOn: STUDY_PLANNER_WEEK_STARTS_ON,
    }),
    end: endOfWeek(currentDate, {
      weekStartsOn: STUDY_PLANNER_WEEK_STARTS_ON,
    }),
  };
}

export function buildWeekDays(currentDate: CalendarDate): CalendarDate[] {
  const weekStart = startOfWeek(currentDate, {
    weekStartsOn: STUDY_PLANNER_WEEK_STARTS_ON,
  });
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function buildMonthDays(
  currentDate: CalendarDate,
  today: CalendarDate
): StudyPlannerCalendarMonthDay[] {
  const monthStart = startOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, {
    weekStartsOn: STUDY_PLANNER_WEEK_STARTS_ON,
  });

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
      weekStartsOn: STUDY_PLANNER_WEEK_STARTS_ON,
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
