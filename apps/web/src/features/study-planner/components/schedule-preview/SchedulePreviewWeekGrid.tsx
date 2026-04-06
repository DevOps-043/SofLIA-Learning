'use client';

import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

import type { SchedulePreviewEvent } from './schedule-preview.types';
import { SchedulePreviewEventBlock } from './SchedulePreviewEventBlock';

// ── Constants ──────────────────────────────────────────────────────────────

const ROW_HEIGHT_PX = 48;

// ── Helpers ────────────────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function getEventPosition(
  event: SchedulePreviewEvent,
  firstVisibleHour: number,
): { top: number; height: number } | null {
  if (event.isAllDay) {
    return null;
  }

  const startMinutes = timeToMinutes(event.startTime);
  const endMinutes = timeToMinutes(event.endTime);
  const firstVisibleMinute = firstVisibleHour * 60;

  if (endMinutes <= firstVisibleMinute) {
    return null;
  }

  const adjustedStart = Math.max(startMinutes - firstVisibleMinute, 0);
  const adjustedEnd = endMinutes - firstVisibleMinute;
  const pixelsPerMinute = ROW_HEIGHT_PX / 60;

  return {
    top: adjustedStart * pixelsPerMinute,
    height: Math.max((adjustedEnd - adjustedStart) * pixelsPerMinute, 18),
  };
}

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
        <div className="w-10 flex-shrink-0 border-r border-gray-200 dark:border-white/10" />

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
                    ? 'bg-[#0A2540] text-white'
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
          <div className="w-10 flex-shrink-0 border-r border-gray-200 px-0.5 py-1 text-right dark:border-white/10">
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
          <div className="w-10 flex-shrink-0 border-r border-gray-200 dark:border-white/10">
            {hours.map((hour) => (
              <div
                key={hour}
                className="flex items-start justify-end border-b border-gray-100 pr-1 pt-0.5 dark:border-white/5"
                style={{ height: `${ROW_HEIGHT_PX}px` }}
              >
                <span className="text-[9px] text-gray-400 dark:text-gray-500">
                  {hour.toString().padStart(2, '0')}
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
                {timedEvents.map((event) => {
                  const position = getEventPosition(event, firstVisibleHour);
                  if (!position) return null;

                  return (
                    <SchedulePreviewEventBlock
                      key={event.id}
                      event={event}
                      top={position.top}
                      height={position.height}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
