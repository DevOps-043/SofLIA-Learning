'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addDays,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';

import type { StudyPlannerStoredLessonDistribution } from '../../../types/planner-schedule.types';
import type {
  SchedulePreviewEvent,
  SchedulePreviewWeekRange,
} from '../schedule-preview.types';

// ── Constants ──────────────────────────────────────────────────────────────

const STUDY_SESSION_COLOR = '#8E24AA';
const EXTERNAL_GOOGLE_COLOR = '#0066CC';
const EXTERNAL_MICROSOFT_COLOR = '#0078D4';
const EXTERNAL_DEFAULT_COLOR = '#4A90D9';

const VISIBLE_HOUR_START = 6;
const VISIBLE_HOUR_END = 23;

// ── External calendar event shape (from /api/study-planner/calendar/events) ─

interface ExternalCalendarEventPayload {
  id?: string;
  title?: string;
  summary?: string;
  start?: string;
  end?: string;
  isAllDay?: boolean;
  provider?: 'google' | 'microsoft';
  color?: string;
}

// ── Hook params ────────────────────────────────────────────────────────────

interface UseSchedulePreviewDataParams {
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[];
  connectedCalendar: 'google' | 'microsoft' | null;
}

// ── Hook return ────────────────────────────────────────────────────────────

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

// ── Helpers ────────────────────────────────────────────────────────────────

function buildWeekRange(referenceDate: Date): SchedulePreviewWeekRange {
  const monday = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const sunday = addDays(monday, 6);

  const startLabel = format(monday, 'd', { locale: es });
  const endLabel = format(sunday, 'd', { locale: es });
  const monthLabel = format(sunday, 'MMM', { locale: es });
  const yearLabel = format(sunday, 'yyyy');

  return {
    start: monday,
    end: sunday,
    label: `${startLabel} - ${endLabel} ${monthLabel} ${yearLabel}`,
  };
}

function buildWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function buildHours(): number[] {
  return Array.from(
    { length: VISIBLE_HOUR_END - VISIBLE_HOUR_START + 1 },
    (_, i) => VISIBLE_HOUR_START + i,
  );
}

function distributionToEvents(
  distributions: StudyPlannerStoredLessonDistribution[],
): SchedulePreviewEvent[] {
  return distributions.map((slot, index) => {
    const lessonNames = slot.lessons.map((l) => l.lessonTitle).join(', ');
    // Calculate total minutes: if stored durations are 0 (old parser bug), fallback to 15min per lesson
    const sumDuration = slot.lessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
    const totalMinutes = sumDuration > 0 ? sumDuration : slot.lessons.length * 15;

    // Dynamic correction for previously stored plans
    const [startH, startM] = slot.startTime.split(':').map(Number);
    const startObj = new Date();
    startObj.setHours(startH || 0, startM || 0, 0, 0);
    const actualEnd = new Date(startObj.getTime() + totalMinutes * 60000);
    const computedEndTime = `${String(actualEnd.getHours()).padStart(2, '0')}:${String(actualEnd.getMinutes()).padStart(2, '0')}`;

    return {
      id: `plan-${slot.dateStr}-${index}`,
      title: slot.lessons.length === 1
        ? slot.lessons[0].lessonTitle
        : `${slot.lessons.length} lecciones`,
      dateStr: slot.dateStr,
      startTime: slot.startTime,
      endTime: computedEndTime,
      source: 'study_plan' as const,
      color: STUDY_SESSION_COLOR,
      description: `${lessonNames} (${totalMinutes} min)`,
    };
  });
}

function externalToEvents(
  payload: ExternalCalendarEventPayload[],
): SchedulePreviewEvent[] {
  return payload
    .filter((e) => e.start && e.title)
    .map((e, index) => {
      const startDate = parseISO(e.start!);
      const endDate = e.end ? parseISO(e.end) : startDate;

      const color =
        e.color ||
        (e.provider === 'google'
          ? EXTERNAL_GOOGLE_COLOR
          : e.provider === 'microsoft'
            ? EXTERNAL_MICROSOFT_COLOR
            : EXTERNAL_DEFAULT_COLOR);

      return {
        id: `ext-${e.id || index}`,
        title: e.title || e.summary || 'Evento',
        dateStr: format(startDate, 'yyyy-MM-dd'),
        startTime: e.isAllDay ? '00:00' : format(startDate, 'HH:mm'),
        endTime: e.isAllDay ? '23:59' : format(endDate, 'HH:mm'),
        source: 'external_calendar' as const,
        color,
        isAllDay: e.isAllDay ?? false,
      };
    });
}

function getEventsForDay(
  events: SchedulePreviewEvent[],
  day: Date,
): SchedulePreviewEvent[] {
  const dayStr = format(day, 'yyyy-MM-dd');
  return events.filter((e) => e.dateStr === dayStr);
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useSchedulePreviewData({
  savedLessonDistribution,
  connectedCalendar,
}: UseSchedulePreviewDataParams): UseSchedulePreviewDataReturn {
  const today = useMemo(() => new Date(), []);

  // Determine initial week from the first distribution slot (or today).
  const initialDate = useMemo(() => {
    if (savedLessonDistribution.length > 0) {
      const firstDate = parseISO(savedLessonDistribution[0].dateStr);
      return Number.isNaN(firstDate.getTime()) ? today : firstDate;
    }
    return today;
  }, [savedLessonDistribution, today]);

  const [currentDate, setCurrentDate] = useState(initialDate);
  const [externalEvents, setExternalEvents] = useState<SchedulePreviewEvent[]>([]);
  const [isLoadingExternal, setIsLoadingExternal] = useState(false);

  // Reset to initial date when distribution changes (new plan generated).
  useEffect(() => {
    setCurrentDate(initialDate);
  }, [initialDate]);

  const weekRange = useMemo(() => buildWeekRange(currentDate), [currentDate]);
  const weekDays = useMemo(() => buildWeekDays(weekRange.start), [weekRange.start]);
  const hours = useMemo(() => buildHours(), []);

  // ── Fetch external calendar events for the visible week ────────────────
  useEffect(() => {
    if (!connectedCalendar) {
      setExternalEvents([]);
      return;
    }

    let cancelled = false;

    async function fetchExternal() {
      setIsLoadingExternal(true);
      try {
        const startDate = format(weekRange.start, 'yyyy-MM-dd');
        const endDate = format(weekRange.end, 'yyyy-MM-dd');
        const response = await fetch(
          `/api/study-planner/calendar/events?startDate=${startDate}&endDate=${endDate}`,
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

  // ── Combine plan events + external events ──────────────────────────────
  const planEvents = useMemo(
    () => distributionToEvents(savedLessonDistribution),
    [savedLessonDistribution],
  );

  const events = useMemo(
    () => [...planEvents, ...externalEvents],
    [planEvents, externalEvents],
  );

  // ── Week navigation ────────────────────────────────────────────────────
  const goToPreviousWeek = useCallback(() => {
    setCurrentDate((prev) => addDays(prev, -7));
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentDate((prev) => addDays(prev, 7));
  }, []);

  const goToCurrentWeek = useCallback(() => {
    setCurrentDate(initialDate);
  }, [initialDate]);

  const hasEvents = events.length > 0;

  return {
    events,
    weekRange,
    weekDays,
    hours,
    today,
    hasEvents,
    isLoadingExternal,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
  };
}

export { getEventsForDay };
