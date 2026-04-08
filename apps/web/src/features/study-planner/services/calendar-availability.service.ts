/**
 * CalendarAvailabilityService
 *
 * Availability analysis based on calendar events:
 * - Detect "Work Block" events (jornada laboral) as availability containers
 * - Subtract standard events (meetings, meals) from within those containers
 * - Fall back to workingHours window on days without work blocks
 */

import type {
  CalendarEvent,
  CalendarAvailability,
  TimeBlock,
} from '../types/user-context.types';

// ---------------------------------------------------------------------------
// Work Block heuristic constants
// ---------------------------------------------------------------------------

/**
 * Title must match one of these keywords to qualify as a work block.
 * Evaluated AFTER the exclude pattern to avoid false positives like "junta de trabajo".
 */
const WORK_BLOCK_TITLE_PATTERN =
  /(trabajo|work|oficina|jornada|laboral|shift|turno|servi[çc]o|expediente)/i;

/**
 * If the title matches any of these keywords the event is disqualified as a
 * work block, regardless of the title pattern above.
 * Rationale: "junta de trabajo" is a meeting, not a work window.
 * "Trabajo Profundo" / Focus Time is a self-imposed concentration block —
 * scheduling study sessions inside it would compete with deep work.
 * PT additions: "reunião" (meeting), "chamada" (call).
 */
const WORK_BLOCK_EXCLUDE_PATTERN =
  /(junta|reuni[oó]n|reuni[aã]o|meeting|llamada|chamada|profundo|deep[\s\-]?work|focus[\s\-]?time|concentraci[oó]n)/i;

/** Minimum event duration (minutes) for an event to be treated as a work block. */
const WORK_BLOCK_MIN_DURATION_MINUTES = 180;

// ---------------------------------------------------------------------------
// Standalone heuristic — exported for direct unit testing
// ---------------------------------------------------------------------------

/**
 * Returns true if a calendar event represents a work-day availability container
 * (i.e. the user's official work shift) rather than a meeting or busy period.
 *
 * Rules (applied in order):
 * 1. Cancelled events are never work blocks.
 * 2. Duration must be >= WORK_BLOCK_MIN_DURATION_MINUTES (180 min).
 * 3. Title must NOT match WORK_BLOCK_EXCLUDE_PATTERN (meetings, deep work, etc.).
 * 4. Title must match WORK_BLOCK_TITLE_PATTERN.
 * 5. Default: false (fail-safe — unknown events fall to Case B behavior).
 */
export function isWorkBlock(event: CalendarEvent): boolean {
  if (event.status === 'cancelled') return false;

  const durationMs =
    new Date(event.endTime).getTime() - new Date(event.startTime).getTime();
  const durationMinutes = durationMs / 60_000;
  if (durationMinutes < WORK_BLOCK_MIN_DURATION_MINUTES) return false;

  if (WORK_BLOCK_EXCLUDE_PATTERN.test(event.title)) return false;
  if (WORK_BLOCK_TITLE_PATTERN.test(event.title)) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class CalendarAvailabilityService {
  /**
   * Analyzes calendar availability across a date range.
   *
   * ### Availability semantics
   *
   * **Case A — work block day:**
   * When the day contains at least one Work Block event (see `isWorkBlock`),
   * the free slots are computed *within* those block windows. Standard events
   * (meetings, meals, etc.) are subtracted from the containers.
   * `busySlots` contains only the interruptions inside the containers;
   * the work block events themselves are the availability container, not obstacles.
   *
   * **Case B — regular day (fallback):**
   * No work blocks detected. All non-cancelled events are treated as busy time
   * within the `workingHours` window. Same behavior as before this change.
   *
   * The return type `CalendarAvailability[]` is unchanged — downstream callers
   * require no modifications.
   */
  static analyzeAvailability(
    events: CalendarEvent[],
    startDate: Date,
    endDate: Date,
    preferredDays: number[] = [1, 2, 3, 4, 5],
    workingHours: { start: number; end: number } = { start: 8, end: 20 }
  ): CalendarAvailability[] {
    const availability: CalendarAvailability[] = [];

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();

      if (preferredDays.includes(dayOfWeek)) {
        const dayStart = new Date(currentDate);
        dayStart.setHours(workingHours.start, 0, 0, 0);

        const dayEnd = new Date(currentDate);
        dayEnd.setHours(workingHours.end, 0, 0, 0);

        // Events that touch this day (same logic as before)
        const dayEvents = events.filter(event => {
          const eventStart = new Date(event.startTime);
          const eventEnd = new Date(event.endTime);
          return (
            eventStart.toDateString() === currentDate.toDateString() ||
            (eventStart < dayEnd && eventEnd > dayStart)
          );
        });

        // Partition into work blocks vs. standard events
        const workBlockEvents = dayEvents.filter(isWorkBlock);
        const standardEvents = dayEvents.filter(
          e => !isWorkBlock(e) && e.status !== 'cancelled'
        );

        let freeSlots: TimeBlock[];
        let busySlots: TimeBlock[];

        if (workBlockEvents.length > 0) {
          // ── Case A: work-block day ────────────────────────────────────────
          const containers = workBlockEvents.map(
            CalendarAvailabilityService.eventToTimeBlock
          );
          const busySlotsFromMeetings = standardEvents.map(
            CalendarAvailabilityService.eventToTimeBlock
          );

          freeSlots = CalendarAvailabilityService.subtractBusyFromContainers(
            containers,
            busySlotsFromMeetings
          );
          busySlots = busySlotsFromMeetings;
        } else {
          // ── Case B: regular day (original behavior) ───────────────────────
          busySlots = standardEvents.map(
            CalendarAvailabilityService.eventToTimeBlock
          );

          busySlots.sort(
            (a, b) =>
              a.startHour * 60 + a.startMinute - (b.startHour * 60 + b.startMinute)
          );

          freeSlots = [];
          let lastEndHour = workingHours.start;
          let lastEndMinute = 0;

          for (const busy of busySlots) {
            if (
              busy.startHour * 60 + busy.startMinute >
              lastEndHour * 60 + lastEndMinute
            ) {
              freeSlots.push({
                startHour: lastEndHour,
                startMinute: lastEndMinute,
                endHour: busy.startHour,
                endMinute: busy.startMinute,
              });
            }

            const busyEndMinutes = busy.endHour * 60 + busy.endMinute;
            if (busyEndMinutes > lastEndHour * 60 + lastEndMinute) {
              lastEndHour = busy.endHour;
              lastEndMinute = busy.endMinute;
            }
          }

          if (lastEndHour * 60 + lastEndMinute < workingHours.end * 60) {
            freeSlots.push({
              startHour: lastEndHour,
              startMinute: lastEndMinute,
              endHour: workingHours.end,
              endMinute: 0,
            });
          }
        }

        availability.push({
          date: currentDate.toISOString().split('T')[0],
          freeSlots,
          busySlots,
          totalFreeMinutes: CalendarAvailabilityService.computeTotals(freeSlots),
          totalBusyMinutes: CalendarAvailabilityService.computeTotals(busySlots),
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return availability;
  }

  /**
   * Finds free time slots that meet a minimum duration requirement.
   */
  static findFreeTimeSlots(
    availability: CalendarAvailability[],
    minDurationMinutes: number
  ): Array<{ date: string; slot: TimeBlock }> {
    const suitableSlots: Array<{ date: string; slot: TimeBlock }> = [];

    for (const day of availability) {
      for (const slot of day.freeSlots) {
        const slotDuration =
          slot.endHour * 60 + slot.endMinute - (slot.startHour * 60 + slot.startMinute);

        if (slotDuration >= minDurationMinutes) {
          suitableSlots.push({ date: day.date, slot });
        }
      }
    }

    return suitableSlots;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /** Converts a CalendarEvent to a TimeBlock using its ISO timestamps. */
  private static eventToTimeBlock(event: CalendarEvent): TimeBlock {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    return {
      startHour: start.getHours(),
      startMinute: start.getMinutes(),
      endHour: end.getHours(),
      endMinute: end.getMinutes(),
    };
  }

  /**
   * Subtracts busy periods from one or more container windows and returns
   * the remaining free slots.
   *
   * Each container is processed independently. Busy slots are clipped to the
   * container's boundaries before subtraction so out-of-container events are
   * ignored for that container.
   */
  private static subtractBusyFromContainers(
    containers: TimeBlock[],
    busySlots: TimeBlock[]
  ): TimeBlock[] {
    const freeSlots: TimeBlock[] = [];

    const sortedContainers = [...containers].sort(
      (a, b) => a.startHour * 60 + a.startMinute - (b.startHour * 60 + b.startMinute)
    );
    const sortedBusy = [...busySlots].sort(
      (a, b) => a.startHour * 60 + a.startMinute - (b.startHour * 60 + b.startMinute)
    );

    for (const container of sortedContainers) {
      const containerStart = container.startHour * 60 + container.startMinute;
      const containerEnd = container.endHour * 60 + container.endMinute;

      let cursor = containerStart;

      for (const busy of sortedBusy) {
        const busyStart = busy.startHour * 60 + busy.startMinute;
        const busyEnd = busy.endHour * 60 + busy.endMinute;

        // Clip busy to container boundaries
        const clippedStart = Math.max(busyStart, containerStart);
        const clippedEnd = Math.min(busyEnd, containerEnd);

        if (clippedStart >= clippedEnd) continue; // busy is outside container

        if (clippedStart > cursor) {
          // There is a free gap before this busy slot
          freeSlots.push({
            startHour: Math.floor(cursor / 60),
            startMinute: cursor % 60,
            endHour: Math.floor(clippedStart / 60),
            endMinute: clippedStart % 60,
          });
        }

        if (clippedEnd > cursor) {
          cursor = clippedEnd;
        }
      }

      // Remaining time after the last busy slot (or the full container if no busy)
      if (cursor < containerEnd) {
        freeSlots.push({
          startHour: Math.floor(cursor / 60),
          startMinute: cursor % 60,
          endHour: Math.floor(containerEnd / 60),
          endMinute: containerEnd % 60,
        });
      }
    }

    return freeSlots;
  }

  /** Sums the total minutes across an array of TimeBlock objects. */
  private static computeTotals(slots: TimeBlock[]): number {
    return slots.reduce(
      (total, slot) =>
        total + (slot.endHour * 60 + slot.endMinute - (slot.startHour * 60 + slot.startMinute)),
      0
    );
  }
}
