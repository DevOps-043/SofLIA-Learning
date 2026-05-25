'use client';

import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

import type { SchedulePreviewEvent } from './schedule-preview.types';
import { SchedulePreviewEventBlock } from './SchedulePreviewEventBlock';
import {
  getEventPosition,
  ROW_HEIGHT_PX,
} from './schedule-preview-position.service';

// ── Constants ──────────────────────────────────────────────────────────────


// ── Helpers ────────────────────────────────────────────────────────────────

// ── Props ──────────────────────────────────────────────────────────────────

interface SchedulePreviewWeekGridProps {
  weekDays: Date[];
  hours: number[];
  today: Date;
  events: SchedulePreviewEvent[];
}

// ── Component ──────────────────────────────────────────────────────────────

export function SchedulePreviewWeekGrid({
  weekDays,
  hours,
  today,
  events,
}: SchedulePreviewWeekGridProps) {
  const firstVisibleHour = hours[0] ?? 6;

  function getEventsForDay(day: Date): SchedulePreviewEvent[] {
    const dayStr = format(day, 'yyyy-MM-dd');
    return events.filter((e) => e.dateStr === dayStr);
  }

  function getAllDayEventsForDay(day: Date): SchedulePreviewEvent[] {
    return getEventsForDay(day).filter((e) => e.isAllDay);
  }

  function getTimedEventsForDay(day: Date): SchedulePreviewEvent[] {
    return getEventsForDay(day).filter((e) => !e.isAllDay);
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-white/10 dark:bg-gray-900">
      {/* Day headers */}
      <div className="flex border-b border-gray-200 dark:border-white/10">
        {/* Time gutter */}
        <div className="w-[50px] flex-shrink-0 border-r border-gray-200 dark:border-white/10" />

        {weekDays.map((day) => {
          const isToday = isSameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              className="flex-1 border-r border-gray-200 px-0.5 py-1.5 text-center last:border-r-0 dark:border-white/10"
            >
              <div className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {format(day, 'EEE', { locale: es })}
              </div>
              <div
                className={`mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  isToday
                    ? 'bg-primary text-white'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day events row (only rendered when at least one exists) */}
      {weekDays.some((d) => getAllDayEventsForDay(d).length > 0) && (
        <div className="flex border-b border-gray-200 dark:border-white/10">
          <div className="w-[50px] flex-shrink-0 border-r border-gray-200 px-0.5 py-1 text-right dark:border-white/10">
            <span className="text-[9px] text-gray-400">todo</span>
          </div>
          {weekDays.map((day) => (
            <div
              key={`allday-${day.toISOString()}`}
              className="flex-1 border-r border-gray-200 p-0.5 last:border-r-0 dark:border-white/10"
            >
              {getAllDayEventsForDay(day).map((event) => (
                <div
                  key={event.id}
                  className="mb-0.5 truncate rounded px-1 py-px text-[9px] font-medium text-white"
                  style={{ backgroundColor: event.color }}
                  title={event.title}
                >
                  {event.title}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Scrollable time grid */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex">
          {/* Time gutter */}
          <div className="w-[50px] flex-shrink-0 border-r border-gray-200 dark:border-white/10 relative">
            {hours.map((hour, index) => (
              <div
                key={hour}
                className="flex items-start justify-end pr-1 border-b border-transparent"
                style={{ height: `${ROW_HEIGHT_PX}px` }}
              >
                <span className="relative -top-2 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const isToday = isSameDay(day, today);
            const timedEvents = getTimedEventsForDay(day);

            return (
              <div
                key={day.toISOString()}
                className={`relative flex-1 border-r border-gray-200 last:border-r-0 dark:border-white/10 ${
                  isToday ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''
                }`}
              >
                {/* Hour rows */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="border-b border-gray-100 dark:border-white/5"
                    style={{ height: `${ROW_HEIGHT_PX}px` }}
                  />
                ))}

                {/* Positioned events */}
                {(() => {
                  const dayTimedEvents = timedEvents.sort((a, b) => {
                    if (a.startTime !== b.startTime) {
                      return a.startTime.localeCompare(b.startTime);
                    }
                    if (a.source !== b.source) {
                      return a.source === 'external_calendar' ? -1 : 1;
                    }
                    return a.endTime.localeCompare(b.endTime);
                  });

                  if (dayTimedEvents.length === 0) return null;

                  // Group events into clusters of overlaps
                  const clusters: SchedulePreviewEvent[][] = [];
                  let currentCluster: SchedulePreviewEvent[] = [];
                  let clusterEndFormatted = '00:00';

                  for (const event of dayTimedEvents) {
                    if (event.startTime < clusterEndFormatted) {
                      currentCluster.push(event);
                      if (event.endTime > clusterEndFormatted) {
                        clusterEndFormatted = event.endTime;
                      }
                    } else {
                      if (currentCluster.length > 0) clusters.push(currentCluster);
                      currentCluster = [event];
                      clusterEndFormatted = event.endTime;
                    }
                  }
                  if (currentCluster.length > 0) clusters.push(currentCluster);

                  return clusters.flatMap(cluster => {
                    const columns: SchedulePreviewEvent[][] = [];
                    const eventToColumn = new Map<string, number>();

                    for (const event of cluster) {
                      let assigned = false;
                      for (let i = 0; i < columns.length; i++) {
                        const lastEventInColumn = columns[i][columns[i].length - 1];
                        if (event.startTime >= lastEventInColumn.endTime) {
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
                      const position = getEventPosition(event, firstVisibleHour);
                      if (!position) return null;
                      
                      // For study plans overlapping with external calendar, force secondary look
                      const isStudyPlan = event.source === 'study_plan';
                      const overlapsWithExternal = cluster.some(e => e.source === 'external_calendar');
                      
                      // Secondary look: indented to the right
                      let left = 0;
                      let width = 100;

                      if (isStudyPlan && overlapsWithExternal) {
                        left = 15;
                        width = 85;
                      } else {
                        const totalColumns = columns.length;
                        const colIndex = eventToColumn.get(event.id)!;
                        const offsetPerColumn = 15;
                        left = totalColumns > 1 
                          ? Math.min(colIndex * offsetPerColumn, (colIndex / totalColumns) * 80)
                          : 0;
                        width = 100 - left;
                      }

                      return (
                        <SchedulePreviewEventBlock
                          key={event.id}
                          event={event}
                          top={position.top}
                          height={position.height}
                          left={left}
                          width={width}
                          zIndex={isStudyPlan ? 100 + left : left}
                        />
                      );
                    });
                  });
                })()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
