'use client';

import type { SchedulePreviewEvent } from './schedule-preview.types';

interface SchedulePreviewEventBlockProps {
  event: SchedulePreviewEvent;
  top: number;
  height: number;
  left?: number;
  width?: number;
  zIndex?: number;
}

export function SchedulePreviewEventBlock({
  event,
  top,
  height,
  left = 0,
  width = 100,
  zIndex = 1,
}: SchedulePreviewEventBlockProps) {
  const isCompact = height < 32;

  return (
    <div
      style={{
        top: `${top}px`,
        height: `${Math.max(height, 18)}px`,
        left: `${left}%`,
        width: `${width}%`,
        backgroundColor: event.color,
        zIndex,
      }}
      className="absolute rounded border border-black/20 border-l-2 border-l-white/40 px-1.5 py-0.5 text-[10px] leading-tight text-white overflow-hidden select-none shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
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
