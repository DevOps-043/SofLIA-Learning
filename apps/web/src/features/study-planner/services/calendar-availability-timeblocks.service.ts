import type { CalendarEvent, TimeBlock } from '../types/user-context.types';

export function eventToTimeBlock(event: CalendarEvent): TimeBlock {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  return {
    startHour: start.getHours(),
    startMinute: start.getMinutes(),
    endHour: end.getHours(),
    endMinute: end.getMinutes(),
  };
}

export function subtractBusyFromContainers(
  containers: TimeBlock[],
  busySlots: TimeBlock[]
): TimeBlock[] {
  const freeSlots: TimeBlock[] = [];
  const sortedContainers = sortTimeBlocks(containers);
  const sortedBusy = sortTimeBlocks(busySlots);

  for (const container of sortedContainers) {
    const containerStart = toMinutes(container.startHour, container.startMinute);
    const containerEnd = toMinutes(container.endHour, container.endMinute);
    let cursor = containerStart;

    for (const busy of sortedBusy) {
      const busyStart = toMinutes(busy.startHour, busy.startMinute);
      const busyEnd = toMinutes(busy.endHour, busy.endMinute);
      const clippedStart = Math.max(busyStart, containerStart);
      const clippedEnd = Math.min(busyEnd, containerEnd);

      if (clippedStart >= clippedEnd) continue;

      if (clippedStart > cursor) {
        freeSlots.push(fromMinuteRange(cursor, clippedStart));
      }

      if (clippedEnd > cursor) {
        cursor = clippedEnd;
      }
    }

    if (cursor < containerEnd) {
      freeSlots.push(fromMinuteRange(cursor, containerEnd));
    }
  }

  return freeSlots;
}

export function computeTimeBlockTotals(slots: TimeBlock[]): number {
  return slots.reduce(
    (total, slot) =>
      total + (slot.endHour * 60 + slot.endMinute - (slot.startHour * 60 + slot.startMinute)),
    0
  );
}

export function sortTimeBlocks(slots: TimeBlock[]): TimeBlock[] {
  return [...slots].sort(
    (a, b) => toMinutes(a.startHour, a.startMinute) - toMinutes(b.startHour, b.startMinute)
  );
}

function fromMinuteRange(start: number, end: number): TimeBlock {
  return {
    startHour: Math.floor(start / 60),
    startMinute: start % 60,
    endHour: Math.floor(end / 60),
    endMinute: end % 60,
  };
}

function toMinutes(hour: number, minute: number): number {
  return hour * 60 + minute;
}
