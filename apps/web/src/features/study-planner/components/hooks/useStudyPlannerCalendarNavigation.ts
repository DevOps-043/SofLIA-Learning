'use client';

import { useCallback, useMemo, useState } from 'react';
import moment from 'moment';

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
  const [currentDate, setCurrentDate] = useState(moment());
  const [view, setView] = useState<ViewType>('month');
  const today = useMemo(() => moment(), []);

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
    setCurrentDate((previousDate) => previousDate.clone().subtract(1, 'month'));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentDate((previousDate) => previousDate.clone().add(1, 'month'));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(moment());
  }, []);

  const goToPreviousWeek = useCallback(() => {
    setCurrentDate((previousDate) => previousDate.clone().subtract(1, 'week'));
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentDate((previousDate) => previousDate.clone().add(1, 'week'));
  }, []);

  const goToPreviousDay = useCallback(() => {
    setCurrentDate((previousDate) => previousDate.clone().subtract(1, 'day'));
  }, []);

  const goToNextDay = useCallback(() => {
    setCurrentDate((previousDate) => previousDate.clone().add(1, 'day'));
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
