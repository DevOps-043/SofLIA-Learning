import {
  differenceInMinutes,
  endOfDay,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay,
} from 'date-fns';
import type { CalendarDate } from '../calendar/types';
import type {
  CalendarEvent,
  StudyPlannerCalendarEventPosition,
} from './study-planner-calendar.types';
import { toCalendarDate } from './study-planner-calendar.date';

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
    return { top: 0, height: 16, left: 0, width: 100, isAllDay: true };
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
    left: 0,
    width: 100,
    isAllDay: false,
  };
}

export function getEventLayoutsForDay(
  events: CalendarEvent[],
  date: CalendarDate
): (CalendarEvent & { position: StudyPlannerCalendarEventPosition })[] {
  const dayEvents = getEventsForDay(events, date);
  const timedEvents = dayEvents
    .filter((e) => !e.isAllDay)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime() ||
                   new Date(a.end).getTime() - new Date(b.end).getTime());

  const allDayEventsLayouts = dayEvents
    .filter((e) => e.isAllDay)
    .map((event) => ({
      ...event,
      position: { top: 0, height: 16, left: 0, width: 100, isAllDay: true }
    }));

  if (timedEvents.length === 0) return allDayEventsLayouts;

  const clusters = buildEventClusters(timedEvents);
  const timedLayouts = clusters.flatMap(cluster =>
    buildTimedLayoutsForCluster(cluster, date),
  );

  return [...allDayEventsLayouts, ...timedLayouts].sort((a, b) => {
    if (a.position.isAllDay && !b.position.isAllDay) return -1;
    if (!a.position.isAllDay && b.position.isAllDay) return 1;
    return new Date(a.start).getTime() - new Date(b.start).getTime();
  });
}

function buildEventClusters(timedEvents: CalendarEvent[]): CalendarEvent[][] {
  const clusters: CalendarEvent[][] = [];
  let currentCluster: CalendarEvent[] = [];
  let clusterEnd = 0;

  for (const event of timedEvents) {
    const start = new Date(event.start).getTime();
    const end = new Date(event.end).getTime();

    if (start < clusterEnd) {
      currentCluster.push(event);
      clusterEnd = Math.max(clusterEnd, end);
    } else {
      if (currentCluster.length > 0) clusters.push(currentCluster);
      currentCluster = [event];
      clusterEnd = end;
    }
  }
  if (currentCluster.length > 0) clusters.push(currentCluster);

  return clusters;
}

function buildTimedLayoutsForCluster(
  cluster: CalendarEvent[],
  date: CalendarDate,
): (CalendarEvent & { position: StudyPlannerCalendarEventPosition })[] {
  const columns: CalendarEvent[][] = [];
  const eventToColumn = new Map<string, number>();

  for (const event of cluster) {
    let assigned = false;
    for (let i = 0; i < columns.length; i++) {
      const lastEventInColumn = columns[i][columns[i].length - 1];
      if (new Date(event.start).getTime() >= new Date(lastEventInColumn.end).getTime()) {
        columns[i].push(event);
        eventToColumn.set(event.id, i);
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      columns.push([event]);
      eventToColumn.set(event.id, columns.length - 1);
    }
  }

  return cluster.map(event => {
    const col = eventToColumn.get(event.id)!;
    const pos = getEventPosition(event, date);
    const offsetPerColumn = 15;
    const left = columns.length > 1
      ? Math.min(col * offsetPerColumn, (col / columns.length) * 80)
      : 0;

    return {
      ...event,
      position: {
        ...pos!,
        left,
        width: 100 - left,
        zIndex: col + 1,
      }
    };
  });
}
