'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDays, parseISO } from 'date-fns';
import type { StudyPlannerStoredLessonDistribution } from '../../../types/planner-schedule.types';
import type {
  SchedulePreviewEvent,
  SchedulePreviewWeekRange,
} from '../schedule-preview.types';
import {
  buildHours,
  buildWeekDays,
  buildWeekRange,
  distributionToEvents,
  externalToEvents,
  getEventsForDay,
  type ExternalCalendarEventPayload,
} from './schedule-preview-data.service';

interface UseSchedulePreviewDataParams {
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[];
  connectedCalendar: 'google' | 'microsoft' | null;
}

interface UseSchedulePreviewDataReturn {
  events: SchedulePreviewEvent[];
  weekRange: SchedulePreviewWeekRange;
  weekDays: Date[];
  hours: number[];
  today: Date;
  hasEvents: boolean;
  isLoadingExternal: boolean;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  goToCurrentWeek: () => void;
}

export function useSchedulePreviewData({
  savedLessonDistribution,
  connectedCalendar,
}: UseSchedulePreviewDataParams): UseSchedulePreviewDataReturn {
  const today = useMemo(() => new Date(), []);
  const initialDate = useMemo(() => {
    if (savedLessonDistribution.length === 0) return today;

    const firstDate = parseISO(savedLessonDistribution[0].dateStr);
    return Number.isNaN(firstDate.getTime()) ? today : firstDate;
  }, [savedLessonDistribution, today]);

  const [currentDate, setCurrentDate] = useState(initialDate);
  const [externalEvents, setExternalEvents] = useState<SchedulePreviewEvent[]>([]);
  const [isLoadingExternal, setIsLoadingExternal] = useState(false);

  useEffect(() => {
    setCurrentDate(initialDate);
  }, [initialDate]);

  const weekRange = useMemo(() => buildWeekRange(currentDate), [currentDate]);
  const weekDays = useMemo(() => buildWeekDays(weekRange.start), [weekRange.start]);
  const hours = useMemo(() => buildHours(), []);

  useEffect(() => {
    if (!connectedCalendar) {
      setExternalEvents([]);
      return;
    }

    let cancelled = false;

    async function fetchExternal() {
      setIsLoadingExternal(true);
      try {
        const response = await fetch(
          `/api/study-planner/calendar/events?startDate=${encodeURIComponent(weekRange.start.toISOString())}&endDate=${encodeURIComponent(weekRange.end.toISOString())}`,
        );

        if (!response.ok || cancelled) {
          if (!cancelled) setExternalEvents([]);
          return;
        }

        const data = (await response.json()) as { events?: ExternalCalendarEventPayload[] };
        if (!cancelled) {
          setExternalEvents(externalToEvents(data.events || []));
        }
      } catch {
        if (!cancelled) setExternalEvents([]);
      } finally {
        if (!cancelled) setIsLoadingExternal(false);
      }
    }

    void fetchExternal();

    return () => {
      cancelled = true;
    };
  }, [connectedCalendar, weekRange.start, weekRange.end]);

  const planEvents = useMemo(
    () => distributionToEvents(savedLessonDistribution),
    [savedLessonDistribution],
  );
  const events = useMemo(
    () => [...planEvents, ...externalEvents],
    [planEvents, externalEvents],
  );

  const goToPreviousWeek = useCallback(() => {
    setCurrentDate(previous => addDays(previous, -7));
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentDate(previous => addDays(previous, 7));
  }, []);

  const goToCurrentWeek = useCallback(() => {
    setCurrentDate(initialDate);
  }, [initialDate]);

  return {
    events,
    weekRange,
    weekDays,
    hours,
    today,
    hasEvents: events.length > 0,
    isLoadingExternal,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
  };
}

export { getEventsForDay };
