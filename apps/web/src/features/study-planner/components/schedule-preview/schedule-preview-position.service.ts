import type { SchedulePreviewEvent } from './schedule-preview.types';

export const ROW_HEIGHT_PX = 48;

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function getEventPosition(
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
