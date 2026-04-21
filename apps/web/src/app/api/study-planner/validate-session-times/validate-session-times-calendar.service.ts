import type { ValidateSessionTimesRequest } from './validate-session-times.service';

export function validateCalendarConflicts(
  body: ValidateSessionTimesRequest,
  warnings: string[],
): void {
  if (!body.calendarEvents || body.calendarEvents.length === 0) {
    return;
  }

  for (const event of body.calendarEvents) {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    const eventDay = eventStart.getDay();

    if (!body.preferredDays.includes(eventDay)) {
      continue;
    }

    const eventStartMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
    const eventEndMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();

    for (const block of body.preferredTimeBlocks || []) {
      const blockStart = block.startHour * 60 + block.startMinute;
      const blockEnd = block.endHour * 60 + block.endMinute;

      if (blockStart < eventEndMinutes && blockEnd > eventStartMinutes) {
        warnings.push(
          `El bloque de estudio ${block.startHour}:${String(block.startMinute).padStart(2, '0')} - ` +
          `${block.endHour}:${String(block.endMinute).padStart(2, '0')} se solapa con el evento "${event.title}".`,
        );
      }
    }
  }
}
