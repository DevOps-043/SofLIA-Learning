import type {
  StudyPlannerCalendarEventLike,
  StudyPlannerCalendarFreeSlot,
} from '../types/planner-schedule.types';

export function pushFreeSlot(
  freeSlots: StudyPlannerCalendarFreeSlot[],
  start: Date,
  end: Date,
  minimumMinutes = 30,
  maximumMinutes = 360,
): void {
  if (start >= end) return;
  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  if (durationMinutes < minimumMinutes) return;
  freeSlots.push({ start: new Date(start), end: new Date(end), durationMinutes: Math.min(durationMinutes, maximumMinutes) });
}

export function buildCompletelyFreeDaySlots(dayDate: Date, currentTime: Date): StudyPlannerCalendarFreeSlot[] {
  const freeSlots: StudyPlannerCalendarFreeSlot[] = [];
  const today = new Date(currentTime);
  today.setHours(0, 0, 0, 0);
  const isToday = dayDate.toDateString() === today.toDateString();

  [
    { startHour: 7, endHour: 12 },
    { startHour: 12, endHour: 18 },
    { startHour: 18, endHour: 22 },
  ].forEach(({ startHour, endHour }) => {
    const slotStart = new Date(dayDate); slotStart.setHours(startHour, 0, 0, 0);
    const slotEnd = new Date(dayDate); slotEnd.setHours(endHour, 0, 0, 0);
    if (!isToday || slotStart.getTime() > currentTime.getTime()) {
      pushFreeSlot(freeSlots, slotStart, slotEnd, 30, 360);
    }
  });

  return freeSlots;
}

export function buildBusyDayFreeSlots(
  dayDate: Date,
  busySlots: Array<{ start: Date; end: Date }>,
  currentTime: Date,
): StudyPlannerCalendarFreeSlot[] {
  const freeSlots: StudyPlannerCalendarFreeSlot[] = [];
  const dayStart = new Date(dayDate); dayStart.setHours(7, 0, 0, 0);
  const dayEnd = new Date(dayDate); dayEnd.setHours(22, 0, 0, 0);
  const isToday = dayDate.toDateString() === currentTime.toDateString();

  let lastEnd = new Date(dayStart);
  if (isToday && lastEnd.getTime() < currentTime.getTime()) {
    lastEnd = new Date(currentTime);
    if (lastEnd.getHours() < 7) lastEnd.setHours(7, 0, 0, 0);
  }

  busySlots.forEach((slot) => {
    if (slot.start > lastEnd) {
      const gapStart = new Date(Math.max(lastEnd.getTime(), dayStart.getTime()));
      const gapEnd = new Date(Math.min(slot.start.getTime(), dayEnd.getTime()));
      if (isToday && gapStart.getTime() < currentTime.getTime()) gapStart.setTime(currentTime.getTime());
      if (gapEnd.getHours() > 22 || (gapEnd.getHours() === 22 && gapEnd.getMinutes() > 0)) gapEnd.setHours(22, 0, 0, 0);
      pushFreeSlot(freeSlots, gapStart, gapEnd, 30, 480);
    }
    lastEnd = new Date(Math.max(lastEnd.getTime(), slot.end.getTime()));
  });

  if (lastEnd < dayEnd) {
    if (isToday && lastEnd.getTime() < currentTime.getTime()) {
      lastEnd = new Date(currentTime);
      if (lastEnd.getHours() < 7) lastEnd.setHours(7, 0, 0, 0);
    }
    const gapMinutes = Math.min((dayEnd.getTime() - lastEnd.getTime()) / (1000 * 60), 360);
    if (gapMinutes >= 30) pushFreeSlot(freeSlots, lastEnd, new Date(lastEnd.getTime() + gapMinutes * 60000), 30, 360);
  }

  return freeSlots;
}

export function buildWorkBlockFreeSlots(
  dayDate: Date,
  workBlocks: StudyPlannerCalendarEventLike[],
  busySlots: Array<{ start: Date; end: Date }>,
  currentTime: Date,
): StudyPlannerCalendarFreeSlot[] {
  const freeSlots: StudyPlannerCalendarFreeSlot[] = [];
  const isToday = dayDate.toDateString() === currentTime.toDateString();

  workBlocks.forEach((wb) => {
    let cursor = new Date(wb.start || wb.startTime || 0);
    const wbEnd = new Date(wb.end || wb.endTime || 0);
    if (isToday && cursor.getTime() < currentTime.getTime()) cursor = new Date(currentTime);

    const sortedBusy = [...busySlots].sort((a, b) => a.start.getTime() - b.start.getTime());
    const wbStartMs = new Date(wb.start || wb.startTime || 0).getTime();

    for (const busy of sortedBusy) {
      const busyStart = new Date(Math.max(busy.start.getTime(), wbStartMs));
      const busyEnd = new Date(Math.min(busy.end.getTime(), wbEnd.getTime()));
      if (busyStart >= busyEnd) continue;
      if (cursor.getTime() < busyStart.getTime()) pushFreeSlot(freeSlots, cursor, busyStart, 15, 360);
      if (cursor.getTime() < busyEnd.getTime()) cursor = busyEnd;
    }

    if (cursor.getTime() < wbEnd.getTime()) pushFreeSlot(freeSlots, cursor, wbEnd, 15, 360);
  });

  return freeSlots;
}
