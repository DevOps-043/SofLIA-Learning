'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  addWeeks,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';

import type { CalendarDate } from '../calendar/types';
import {
  STUDY_PLANNER_HOURS,
  STUDY_PLANNER_WEEKDAY_NAMES,
} from './study-planner-calendar.constants';
import type { ViewType } from './study-planner-calendar.types';
import {
  buildMonthDays,
  buildWeekDays,
  buildWeekRange,
} from './study-planner-calendar.utils';

export function useStudyPlannerCalendarNavigation() {
  const [currentDate, setCurrentDate] = useState<CalendarDate>(() => new Date());
  const [view, setView] = useState<ViewType>('month');
  const today = useMemo<CalendarDate>(() => new Date(), []);

  const monthDays = useMemo(
    () => (view === 'month' ? buildMonthDays(currentDate, today) : []),
    [currentDate, today, view]
  );
  const weekDays = useMemo(
    () => (view === 'week' ? buildWeekDays(currentDate) : []),
    [currentDate, view]
  );
  const weekRange = useMemo(
    () => (view === 'week' ? buildWeekRange(currentDate) : null),
    [currentDate, view]
  );

  const goToPreviousMonth = useCallback(() => {
    setCurrentDate((previousDate) => subMonths(previousDate, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentDate((previousDate) => addMonths(previousDate, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const goToPreviousWeek = useCallback(() => {
    setCurrentDate((previousDate) => subWeeks(previousDate, 1));
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentDate((previousDate) => addWeeks(previousDate, 1));
  }, []);

  const goToPreviousDay = useCallback(() => {
    setCurrentDate((previousDate) => subDays(previousDate, 1));
  }, []);

  const goToNextDay = useCallback(() => {
    setCurrentDate((previousDate) => addDays(previousDate, 1));
  }, []);

  return {
    currentDate,
    setCurrentDate,
    view,
    setView,
    today,
    monthDays,
    weekDays,
    weekRange,
    hours: STUDY_PLANNER_HOURS,
    weekDayNames: STUDY_PLANNER_WEEKDAY_NAMES,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    goToPreviousWeek,
    goToNextWeek,
    goToPreviousDay,
    goToNextDay,
  };
}
