import {
  addDays,
  endOfDay,
  endOfWeek,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import type { CalendarDate } from '../calendar/types'
import { STUDY_PLANNER_WEEK_STARTS_ON } from './study-planner-calendar.constants'
import type {
  StudyPlannerCalendarMonthDay,
  StudyPlannerCalendarWeekRange,
  ViewType,
} from './study-planner-calendar.types'

export function buildWeekRange(
  currentDate: CalendarDate,
): StudyPlannerCalendarWeekRange {
  return {
    start: startOfWeek(currentDate, {
      weekStartsOn: STUDY_PLANNER_WEEK_STARTS_ON,
    }),
    end: endOfWeek(currentDate, {
      weekStartsOn: STUDY_PLANNER_WEEK_STARTS_ON,
    }),
  }
}

export function buildWeekDays(currentDate: CalendarDate): CalendarDate[] {
  const weekStart = startOfWeek(currentDate, {
    weekStartsOn: STUDY_PLANNER_WEEK_STARTS_ON,
  })
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
}

export function buildMonthDays(
  currentDate: CalendarDate,
  today: CalendarDate,
): StudyPlannerCalendarMonthDay[] {
  const monthStart = startOfMonth(currentDate)
  const gridStart = startOfWeek(monthStart, {
    weekStartsOn: STUDY_PLANNER_WEEK_STARTS_ON,
  })

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index)

    return {
      date,
      isCurrentMonth: isSameMonth(date, currentDate),
      isToday: isSameDay(date, today),
      dayNumber: date.getDate(),
    }
  })
}

export function resolveCalendarRange(
  currentDate: CalendarDate,
  view: ViewType,
): { startDate: CalendarDate; endDate: CalendarDate } | null {
  if (view === 'month') {
    const startDate = startOfWeek(startOfMonth(currentDate), {
      weekStartsOn: STUDY_PLANNER_WEEK_STARTS_ON,
    })

    return {
      startDate,
      endDate: addDays(startDate, 41),
    }
  }

  if (view === 'week') {
    const weekRange = buildWeekRange(currentDate)
    return {
      startDate: startOfDay(weekRange.start),
      endDate: endOfDay(weekRange.end),
    }
  }

  if (view === 'day') {
    return {
      startDate: startOfDay(currentDate),
      endDate: endOfDay(currentDate),
    }
  }

  return null
}
