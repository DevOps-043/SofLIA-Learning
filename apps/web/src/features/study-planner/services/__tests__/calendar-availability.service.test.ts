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

describe('isWorkBlock — title + duration heuristic', () => {
  it('returns true for "Trabajo" 9h', () => {
    expect(
      isWorkBlock(makeEvent('Trabajo', localISO(DATE, 9), localISO(DATE, 18)))
    ).toBe(true);
  });

  it('returns true for English keyword "work" 9h', () => {
    expect(
      isWorkBlock(makeEvent('work', localISO(DATE, 8), localISO(DATE, 17)))
    ).toBe(true);
  });

  it('returns true for "Jornada Laboral" 8h', () => {
    expect(
      isWorkBlock(makeEvent('Jornada Laboral', localISO(DATE, 7), localISO(DATE, 15)))
    ).toBe(true);
  });

  it('returns false when duration is below 180 min (150 min)', () => {
    expect(
      isWorkBlock(makeEvent('Trabajo', localISO(DATE, 9, 0), localISO(DATE, 11, 30)))
    ).toBe(false);
  });

  it('returns false for "Junta de trabajo" even though 9h — excluded by "junta"', () => {
    expect(
      isWorkBlock(makeEvent('Junta de trabajo', localISO(DATE, 9), localISO(DATE, 18)))
    ).toBe(false);
  });

  it('returns false for "Reunion de trabajo" — excluded by "reunion"', () => {
    expect(
      isWorkBlock(makeEvent('Reunion de trabajo', localISO(DATE, 9), localISO(DATE, 18)))
    ).toBe(false);
  });

  it('returns false for "Trabajo Profundo" 4h — excluded by "profundo"', () => {
    expect(
      isWorkBlock(makeEvent('Trabajo Profundo', localISO(DATE, 10), localISO(DATE, 14)))
    ).toBe(false);
  });

  it('returns false for "Comida" — no matching keyword, short', () => {
    expect(
      isWorkBlock(makeEvent('Comida', localISO(DATE, 14), localISO(DATE, 15)))
    ).toBe(false);
  });

  it('returns false for cancelled "Trabajo" 9h', () => {
    expect(
      isWorkBlock(makeEvent('Trabajo', localISO(DATE, 9), localISO(DATE, 18), 'cancelled'))
    ).toBe(false);
  });

  it('returns true for "oficina" at exactly 180 min boundary', () => {
    expect(
      isWorkBlock(makeEvent('oficina', localISO(DATE, 9, 0), localISO(DATE, 12, 0)))
    ).toBe(true);
  });

  it('returns false for "oficina" at 179 min — one minute below threshold', () => {
    expect(
      isWorkBlock(makeEvent('oficina', localISO(DATE, 9, 0), localISO(DATE, 11, 59)))
    ).toBe(false);
  });

  it('returns false for "Focus Time" 4h — excluded by pattern', () => {
    expect(
      isWorkBlock(makeEvent('Focus Time', localISO(DATE, 9), localISO(DATE, 13)))
    ).toBe(false);
  });

  it('returns false for "Deep Work" 4h — excluded by pattern', () => {
    expect(
      isWorkBlock(makeEvent('Deep Work', localISO(DATE, 9), localISO(DATE, 13)))
    ).toBe(false);
  });

  // Portuguese vocabulary
  it('returns true for "Serviço" 8h — PT work keyword', () => {
    expect(
      isWorkBlock(makeEvent('Serviço', localISO(DATE, 8), localISO(DATE, 16)))
    ).toBe(true);
  });

  it('returns true for "expediente" 9h — PT work keyword', () => {
    expect(
      isWorkBlock(makeEvent('expediente', localISO(DATE, 9), localISO(DATE, 18)))
    ).toBe(true);
  });

  it('returns false for "Reunião de trabalho" 9h — excluded by PT meeting keyword', () => {
    expect(
      isWorkBlock(makeEvent('Reunião de trabalho', localISO(DATE, 9), localISO(DATE, 18)))
    ).toBe(false);
  });

  it('returns false for "Chamada de serviço" 9h — excluded by PT call keyword', () => {
    expect(
      isWorkBlock(makeEvent('Chamada de serviço', localISO(DATE, 9), localISO(DATE, 18)))
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Suite 2 — analyzeAvailability: Case A (work block days)
// ---------------------------------------------------------------------------

describe('analyzeAvailability — Case A: work block days', () => {
  it('spec regression: "Trabajo" 09–18, "Comida" 14–15, "Junta de sincronización de trabajo" 10–11 → [09–10, 11–14, 15–18]', () => {
    const events = [
      makeEvent('Trabajo', localISO(DATE, 9), localISO(DATE, 18)),
      makeEvent('Comida', localISO(DATE, 14), localISO(DATE, 15)),
      makeEvent('Junta de sincronización de trabajo', localISO(DATE, 10), localISO(DATE, 11)),
    ];

    const [day] = eventsOnDate(events);

    expect(day.freeSlots).toHaveLength(3);
    expect(day.freeSlots[0]).toMatchObject({ startHour: 9, startMinute: 0, endHour: 10, endMinute: 0 });
    expect(day.freeSlots[1]).toMatchObject({ startHour: 11, startMinute: 0, endHour: 14, endMinute: 0 });
    expect(day.freeSlots[2]).toMatchObject({ startHour: 15, startMinute: 0, endHour: 18, endMinute: 0 });
    expect(day.totalFreeMinutes).toBe(60 + 180 + 180); // 420
  });

  it('work block with no meetings → full block as one free slot, busySlots empty', () => {
    const events = [
      makeEvent('Trabajo', localISO(DATE, 9), localISO(DATE, 18)),
    ];

    const [day] = eventsOnDate(events);

    expect(day.freeSlots).toHaveLength(1);
    expect(day.freeSlots[0]).toMatchObject({ startHour: 9, startMinute: 0, endHour: 18, endMinute: 0 });
    expect(day.busySlots).toHaveLength(0);
    expect(day.totalFreeMinutes).toBe(540);
    expect(day.totalBusyMinutes).toBe(0);
  });

  it('meeting starting before work block is clipped to block start', () => {
    const events = [
      makeEvent('Trabajo', localISO(DATE, 9), localISO(DATE, 18)),
      // meeting 08:30–10:00 — overlaps into the work block
      makeEvent('Reunión temprana', localISO(DATE, 8, 30), localISO(DATE, 10, 0)),
    ];

    const [day] = eventsOnDate(events);

    // Free time should start at 10:00 (where the meeting ends)
    expect(day.freeSlots[0]).toMatchObject({ startHour: 10, startMinute: 0, endHour: 18, endMinute: 0 });
  });

  it('two work blocks (split shift) + one meeting covering part of first block', () => {
    const events = [
      makeEvent('Turno mañana', localISO(DATE, 8), localISO(DATE, 12)),
      makeEvent('Turno tarde', localISO(DATE, 13), localISO(DATE, 17)),
      makeEvent('Reunión', localISO(DATE, 10), localISO(DATE, 11)),
    ];

    const [day] = eventsOnDate(events);

    // From first block: 08–10, 11–12
    // From second block: 13–17 (no meetings)
    expect(day.freeSlots).toHaveLength(3);
    expect(day.freeSlots[0]).toMatchObject({ startHour: 8, endHour: 10 });
    expect(day.freeSlots[1]).toMatchObject({ startHour: 11, endHour: 12 });
    expect(day.freeSlots[2]).toMatchObject({ startHour: 13, endHour: 17 });
  });

  it('cancelled event inside work block does not appear in busySlots', () => {
    const events = [
      makeEvent('Trabajo', localISO(DATE, 9), localISO(DATE, 18)),
      makeEvent('Junta cancelada', localISO(DATE, 11), localISO(DATE, 12), 'cancelled'),
    ];

    const [day] = eventsOnDate(events);

    expect(day.busySlots).toHaveLength(0);
    expect(day.freeSlots).toHaveLength(1);
    expect(day.totalFreeMinutes).toBe(540);
  });

  it('work block completely occupied by a meeting → freeSlots empty', () => {
    const events = [
      makeEvent('Trabajo', localISO(DATE, 9), localISO(DATE, 18)),
      makeEvent('Reunión todo el día', localISO(DATE, 9), localISO(DATE, 18)),
    ];

    const [day] = eventsOnDate(events);

    expect(day.freeSlots).toHaveLength(0);
    expect(day.totalFreeMinutes).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Suite 3 — analyzeAvailability: Case B (regular days, regression)
// ---------------------------------------------------------------------------

