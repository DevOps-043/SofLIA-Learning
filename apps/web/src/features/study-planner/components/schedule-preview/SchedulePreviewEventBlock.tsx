'use client';

import type { SchedulePreviewEvent } from './schedule-preview.types';

interface SchedulePreviewEventBlockProps {
  event: SchedulePreviewEvent;
  top: number;
  height: number;
}

export function SchedulePreviewEventBlock({
  event,
  top,
  height,
}: SchedulePreviewEventBlockProps) {
  const isCompact = height < 32;

  return (
    <div
      style={{
        top: `${top}px`,
        height: `${Math.max(height, 18)}px`,
        backgroundColor: event.color,
        borderColor: event.color,
      }}
      className="absolute left-0.5 right-0.5 rounded border-l-2 px-1.5 py-0.5 text-[10px] leading-tight text-white overflow-hidden select-none"
      title={event.description || `${event.title}\n${event.startTime} - ${event.endTime}`}
    >
      <div className="font-semibold truncate">{event.title}</div>
      {!isCompact && (
        <div className="truncate opacity-80 mt-px">
          {event.startTime} - {event.endTime}
        </div>
      )}
    </div>
  );
}
