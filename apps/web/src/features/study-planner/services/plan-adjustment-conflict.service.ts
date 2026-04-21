import type {
  StudyPlannerCalendarDataMap,
} from '../types/planner-schedule.types';
import type { StudyPlannerScheduleConflictResult } from './plan-adjustment.types';

export function validateScheduleConflict(
  savedCalendarData: StudyPlannerCalendarDataMap | null,
  date: Date,
  startTime: Date,
  endTime: Date,
): StudyPlannerScheduleConflictResult {
  if (!savedCalendarData) {
    return { hasConflict: false };
  }

  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
  const dayData = savedCalendarData[dateStr];

  if (!dayData || !dayData.busySlots || dayData.busySlots.length === 0) {
    return { hasConflict: false };
  }

  for (const busySlot of dayData.busySlots) {
    const busyStart = new Date(busySlot.start);
    const busyEnd = new Date(busySlot.end);

    if (
      (startTime >= busyStart && startTime < busyEnd)
      || (endTime > busyStart && endTime <= busyEnd)
      || (startTime <= busyStart && endTime >= busyEnd)
    ) {
      const conflictingEvent = dayData.events.find((event) => {
        const eventStart = new Date(event.start || event.startTime || busyStart);
        return eventStart.getTime() === busyStart.getTime();
      });

      return {
        hasConflict: true,
        conflictingEvent: conflictingEvent || { start: busyStart, end: busyEnd },
      };
    }
  }

  return { hasConflict: false };
}
