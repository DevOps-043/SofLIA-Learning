import { describe, it, expect } from 'vitest';

import {
  isWorkBlock,
  CalendarAvailabilityService,
} from '../calendar-availability.service';
import type { CalendarEvent } from '../../types/user-context.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(
  title: string,
  startISO: string,
  endISO: string,
  status: CalendarEvent['status'] = 'confirmed'
): CalendarEvent {
  return {
    id: `evt-${title}`,
    title,
    startTime: startISO,
    endTime: endISO,
    isAllDay: false,
    isRecurring: false,
    status,
  };
}

/**
 * Builds an ISO string for a specific date + time expressed in LOCAL time.
 * Uses Date constructor with explicit parts to avoid UTC offsets changing the
 * hours reported by getHours().
 */
function localISO(date: string, hour: number, minute = 0): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, hour, minute).toISOString();
}

const DATE = '2025-06-02'; // Monday

function eventsOnDate(items: CalendarEvent[]): CalendarAvailability[] {
  const day = new Date(2025, 5, 2); // June 2 2025 (local)
  return CalendarAvailabilityService.analyzeAvailability(
    items,
    day,
    day,
    [day.getDay()], // include this specific day of week (1 = Monday)
    { start: 8, end: 20 }
  );
}

// Alias to improve readability
type CalendarAvailability = ReturnType<
  typeof CalendarAvailabilityService.analyzeAvailability
>[number];

// ---------------------------------------------------------------------------
// Suite 1 — isWorkBlock heuristic
// ---------------------------------------------------------------------------


describe('analyzeAvailability — Case B: regular days (regression)', () => {
  it('day with no events → freeSlots spans full workingHours window', () => {
    const [day] = eventsOnDate([]);

    expect(day.freeSlots).toHaveLength(1);
    expect(day.freeSlots[0]).toMatchObject({ startHour: 8, startMinute: 0, endHour: 20, endMinute: 0 });
    expect(day.totalFreeMinutes).toBe(720);
  });

  it('one normal event 10:00–11:00 → freeSlots = [08:00–10:00, 11:00–20:00]', () => {
    const events = [makeEvent('Junta', localISO(DATE, 10), localISO(DATE, 11))];
    const [day] = eventsOnDate(events);

    expect(day.freeSlots).toHaveLength(2);
    expect(day.freeSlots[0]).toMatchObject({ startHour: 8, endHour: 10 });
    expect(day.freeSlots[1]).toMatchObject({ startHour: 11, endHour: 20 });
  });

  it('all events cancelled → freeSlots spans full workingHours window', () => {
    const events = [
      makeEvent('Junta', localISO(DATE, 10), localISO(DATE, 11), 'cancelled'),
      makeEvent('Comida', localISO(DATE, 14), localISO(DATE, 15), 'cancelled'),
    ];
    const [day] = eventsOnDate(events);

    expect(day.freeSlots).toHaveLength(1);
    expect(day.totalFreeMinutes).toBe(720);
  });

  it('"Trabajo Profundo" 4h is treated as busy, NOT as a work block container', () => {
    const events = [
      makeEvent('Trabajo Profundo', localISO(DATE, 9), localISO(DATE, 13)),
    ];
    const [day] = eventsOnDate(events);

    // busySlots should contain the Deep Work block
    expect(day.busySlots).toHaveLength(1);
    // freeSlots should NOT span 09–13 as if it were an availability container
    const freeSpansDeepWork = day.freeSlots.some(
      s => s.startHour <= 9 && s.endHour >= 13
    );
    expect(freeSpansDeepWork).toBe(false);
    // Total free is less than the full window
    expect(day.totalFreeMinutes).toBeLessThan(720);
  });

  it('day not in preferredDays is excluded from output', () => {
    const day = new Date(2025, 5, 2); // Monday (dayOfWeek = 1)
    const result = CalendarAvailabilityService.analyzeAvailability(
      [],
      day,
      day,
      [3, 4, 5], // Only Wed, Thu, Fri — Monday is excluded
      { start: 8, end: 20 }
    );
    expect(result).toHaveLength(0);
  });

  it('multi-day range with Case A and Case B days — each processed independently', () => {
    const monday = new Date(2025, 5, 2);
    const tuesday = new Date(2025, 5, 3);
    const mondayDate = '2025-06-02';
    const tuesdayDate = '2025-06-03';

    const events = [
      // Monday: has a work block → Case A
      makeEvent('Trabajo', localISO(mondayDate, 9), localISO(mondayDate, 18)),
      makeEvent('Junta', localISO(mondayDate, 11), localISO(mondayDate, 12)),
      // Tuesday: no work block → Case B
      makeEvent('Llamada', localISO(tuesdayDate, 10), localISO(tuesdayDate, 11)),
    ];

    const result = CalendarAvailabilityService.analyzeAvailability(
      events,
      monday,
      tuesday,
      [1, 2],
      { start: 8, end: 20 }
    );

    expect(result).toHaveLength(2);

    const mondayResult = result.find(r => r.date === mondayDate)!;
    const tuesdayResult = result.find(r => r.date === tuesdayDate)!;

    // Monday (Case A): free slots are within the 09–18 work block minus 11–12 meeting
    expect(mondayResult.freeSlots.every(s => s.startHour >= 9 && s.endHour <= 18)).toBe(true);

    // Tuesday (Case B): free slots span workingHours minus the 10–11 call
    expect(tuesdayResult.freeSlots[0]).toMatchObject({ startHour: 8, endHour: 10 });
    expect(tuesdayResult.freeSlots[1]).toMatchObject({ startHour: 11, endHour: 20 });
  });
});

// ---------------------------------------------------------------------------
// Suite 4 — findFreeTimeSlots (regression — method unchanged)
// ---------------------------------------------------------------------------

describe('findFreeTimeSlots', () => {
  it('returns slots at or above the minimum duration', () => {
    const availability = eventsOnDate([]);
    const result = CalendarAvailabilityService.findFreeTimeSlots(availability, 60);
    expect(result.length).toBeGreaterThan(0);
    result.forEach(({ slot }) => {
      const duration = slot.endHour * 60 + slot.endMinute - (slot.startHour * 60 + slot.startMinute);
      expect(duration).toBeGreaterThanOrEqual(60);
    });
  });

  it('filters out slots below minimum duration', () => {
    // Create a day where the only free slot is 30 min
    const events = [
      makeEvent('Evento A', localISO(DATE, 8), localISO(DATE, 19, 30)),
    ];
    const availability = eventsOnDate(events);
    const result = CalendarAvailabilityService.findFreeTimeSlots(availability, 60);
    expect(result).toHaveLength(0);
  });

  it('empty availability returns empty result', () => {
    expect(CalendarAvailabilityService.findFreeTimeSlots([], 30)).toHaveLength(0);
  });

  it('collects matching slots from multiple days', () => {
    const monday = new Date(2025, 5, 2);
    const tuesday = new Date(2025, 5, 3);

    const result = CalendarAvailabilityService.analyzeAvailability(
      [],
      monday,
      tuesday,
      [1, 2],
      { start: 8, end: 20 }
    );

    const slots = CalendarAvailabilityService.findFreeTimeSlots(result, 60);
    expect(slots.length).toBeGreaterThanOrEqual(2); // at least one slot per day
  });
});
