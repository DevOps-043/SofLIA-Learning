import {
  addDays,
  endOfDay,
  format,
  parseISO,
  startOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import type { StudyPlannerStoredLessonDistribution } from '../../../types/planner-schedule.types';
import { STUDY_PLANNER_WEEK_STARTS_ON } from '../../hooks/study-planner-calendar.constants';
import type {
  SchedulePreviewEvent,
  SchedulePreviewWeekRange,
} from '../schedule-preview.types';

const STUDY_SESSION_COLOR = 'var(--color-legacy-8e24aa)';
const EXTERNAL_GOOGLE_COLOR = 'var(--color-legacy-0066cc)';
const EXTERNAL_MICROSOFT_COLOR = 'var(--color-legacy-0078d4)';
const EXTERNAL_DEFAULT_COLOR = 'var(--color-legacy-4a90d9)';
const VISIBLE_HOUR_START = 6;
const VISIBLE_HOUR_END = 23;

export interface ExternalCalendarEventPayload {
  id?: string;
  title?: string;
  summary?: string;
  start?: string;
  end?: string;
  isAllDay?: boolean;
  provider?: 'google' | 'microsoft';
  color?: string;
}

export function buildWeekRange(referenceDate: Date): SchedulePreviewWeekRange {
  const weekStart = startOfWeek(referenceDate, {
    weekStartsOn: STUDY_PLANNER_WEEK_STARTS_ON,
  });
  const weekEndDay = addDays(weekStart, 6);
  const startLabel = format(weekStart, 'd', { locale: es });
  const endLabel = format(weekEndDay, 'd', { locale: es });
  const monthLabel = format(weekEndDay, 'MMM', { locale: es });
  const yearLabel = format(weekEndDay, 'yyyy');

  return {
    start: weekStart,
    end: endOfDay(weekEndDay),
    label: `${startLabel} - ${endLabel} ${monthLabel} ${yearLabel}`,
  };
}

export function buildWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function buildHours(): number[] {
  return Array.from(
    { length: VISIBLE_HOUR_END - VISIBLE_HOUR_START + 1 },
    (_, index) => VISIBLE_HOUR_START + index,
  );
}

export function distributionToEvents(
  distributions: StudyPlannerStoredLessonDistribution[],
): SchedulePreviewEvent[] {
  return distributions.map((slot, index) => {
    const lessonNames = slot.lessons.map(lesson => lesson.lessonTitle).join(', ');
    const eventTitle =
      slot.lessons.length === 0
        ? 'Sesion de estudio'
        : slot.lessons.length === 1
          ? slot.lessons[0].lessonTitle
          : `${slot.lessons[0].lessonTitle} y ${slot.lessons.length - 1} mas`;

    return {
      id: `plan-${slot.dateStr}-${index}`,
      title: eventTitle,
      dateStr: slot.dateStr,
      startTime: slot.startTime,
      endTime: slot.endTime,
      source: 'study_plan',
      color: STUDY_SESSION_COLOR,
      description: lessonNames,
    };
  });
}

export function externalToEvents(
  payload: ExternalCalendarEventPayload[],
): SchedulePreviewEvent[] {
  return payload
    .filter(event => event.start && event.title)
    .map((event, index) => {
      const startDate = parseISO(event.start!);
      const endDate = event.end ? parseISO(event.end) : startDate;

      return {
        id: `ext-${event.id || index}`,
        title: event.title || event.summary || 'Evento',
        dateStr: format(startDate, 'yyyy-MM-dd'),
        startTime: event.isAllDay ? '00:00' : format(startDate, 'HH:mm'),
        endTime: event.isAllDay ? '23:59' : format(endDate, 'HH:mm'),
        source: 'external_calendar',
        color: getExternalEventColor(event),
        isAllDay: event.isAllDay ?? false,
      };
    });
}

export function getEventsForDay(
  events: SchedulePreviewEvent[],
  day: Date,
): SchedulePreviewEvent[] {
  const dayStr = format(day, 'yyyy-MM-dd');
  return events.filter(event => event.dateStr === dayStr);
}

function getExternalEventColor(event: ExternalCalendarEventPayload): string {
  if (event.color) return event.color;
  if (event.provider === 'google') return EXTERNAL_GOOGLE_COLOR;
  if (event.provider === 'microsoft') return EXTERNAL_MICROSOFT_COLOR;
  return EXTERNAL_DEFAULT_COLOR;
}
