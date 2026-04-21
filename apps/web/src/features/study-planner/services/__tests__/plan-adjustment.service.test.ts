import { describe, it, expect } from 'vitest';
import {
  validateScheduleConflict,
  validateSchedulePlacementRules,
  userExplicitlyAllowsOutsideWorkBlocks,
  extractTimeChangeRequest,
  extractDateChangeRequest,
} from '../plan-adjustment.service';
import type { StudyPlannerStoredLessonDistribution } from '../../types/planner-schedule.types';

// ─── validateScheduleConflict ─────────────────────────────────────────────────

describe('validateScheduleConflict', () => {
  const makeDate = (dateStr: string, time: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [h, m] = time.split(':').map(Number);
    return new Date(year, month - 1, day, h, m, 0, 0);
  };

  it('returns no conflict when savedCalendarData is null', () => {
    const date = makeDate('2025-06-15', '00:00');
    const start = makeDate('2025-06-15', '09:00');
    const end = makeDate('2025-06-15', '10:00');
    const result = validateScheduleConflict(null, date, start, end);
    expect(result.hasConflict).toBe(false);
  });

  it('returns no conflict when date has no entry in calendar data', () => {
    const calendarData = { '2025-06-16': { busySlots: [], events: [] } };
    const date = makeDate('2025-06-15', '00:00');
    const start = makeDate('2025-06-15', '09:00');
    const end = makeDate('2025-06-15', '10:00');
    const result = validateScheduleConflict(calendarData as any, date, start, end);
    expect(result.hasConflict).toBe(false);
  });

  it('returns no conflict when busySlots is empty', () => {
    const calendarData = { '2025-06-15': { busySlots: [], events: [] } };
    const date = makeDate('2025-06-15', '00:00');
    const start = makeDate('2025-06-15', '09:00');
    const end = makeDate('2025-06-15', '10:00');
    const result = validateScheduleConflict(calendarData as any, date, start, end);
    expect(result.hasConflict).toBe(false);
  });

  it('detects conflict when slot overlaps busy slot start', () => {
    const calendarData = {
      '2025-06-15': {
        busySlots: [
          { start: '2025-06-15T09:30:00', end: '2025-06-15T10:30:00' },
        ],
        events: [],
      },
    };
    const date = makeDate('2025-06-15', '00:00');
    const start = makeDate('2025-06-15', '09:00');
    const end = makeDate('2025-06-15', '10:00');
    const result = validateScheduleConflict(calendarData as any, date, start, end);
    expect(result.hasConflict).toBe(true);
  });

  it('detects conflict when slot end overlaps busy slot end', () => {
    const calendarData = {
      '2025-06-15': {
        busySlots: [
          { start: '2025-06-15T08:00:00', end: '2025-06-15T09:30:00' },
        ],
        events: [],
      },
    };
    const date = makeDate('2025-06-15', '00:00');
    const start = makeDate('2025-06-15', '09:00');
    const end = makeDate('2025-06-15', '10:00');
    const result = validateScheduleConflict(calendarData as any, date, start, end);
    expect(result.hasConflict).toBe(true);
  });

  it('detects conflict when slot fully encompasses busy slot', () => {
    const calendarData = {
      '2025-06-15': {
        busySlots: [
          { start: '2025-06-15T09:15:00', end: '2025-06-15T09:45:00' },
        ],
        events: [],
      },
    };
    const date = makeDate('2025-06-15', '00:00');
    const start = makeDate('2025-06-15', '09:00');
    const end = makeDate('2025-06-15', '10:00');
    const result = validateScheduleConflict(calendarData as any, date, start, end);
    expect(result.hasConflict).toBe(true);
  });

  it('no conflict when slot ends exactly at busy start', () => {
    const calendarData = {
      '2025-06-15': {
        busySlots: [
          { start: '2025-06-15T10:00:00', end: '2025-06-15T11:00:00' },
        ],
        events: [],
      },
    };
    const date = makeDate('2025-06-15', '00:00');
    const start = makeDate('2025-06-15', '09:00');
    const end = makeDate('2025-06-15', '10:00');
    const result = validateScheduleConflict(calendarData as any, date, start, end);
    expect(result.hasConflict).toBe(false);
  });

  it('no conflict when slot starts exactly at busy end', () => {
    const calendarData = {
      '2025-06-15': {
        busySlots: [
          { start: '2025-06-15T08:00:00', end: '2025-06-15T09:00:00' },
        ],
        events: [],
      },
    };
    const date = makeDate('2025-06-15', '00:00');
    const start = makeDate('2025-06-15', '09:00');
    const end = makeDate('2025-06-15', '10:00');
    const result = validateScheduleConflict(calendarData as any, date, start, end);
    expect(result.hasConflict).toBe(false);
  });

  it('returns conflicting event from events array when available', () => {
    const calendarData = {
      '2025-06-15': {
        busySlots: [
          { start: '2025-06-15T09:30:00', end: '2025-06-15T10:30:00' },
        ],
        events: [
          { title: 'Team Meeting', start: '2025-06-15T09:30:00', end: '2025-06-15T10:30:00' },
        ],
      },
    };
    const date = makeDate('2025-06-15', '00:00');
    const start = makeDate('2025-06-15', '09:00');
    const end = makeDate('2025-06-15', '10:00');
    const result = validateScheduleConflict(calendarData as any, date, start, end);
    expect(result.hasConflict).toBe(true);
    expect((result.conflictingEvent as any).title).toBe('Team Meeting');
  });

  it('returns fallback event with start/end when no matching event', () => {
    const calendarData = {
      '2025-06-15': {
        busySlots: [
          { start: '2025-06-15T09:30:00', end: '2025-06-15T10:30:00' },
        ],
        events: [],
      },
    };
    const date = makeDate('2025-06-15', '00:00');
    const start = makeDate('2025-06-15', '09:00');
    const end = makeDate('2025-06-15', '10:00');
    const result = validateScheduleConflict(calendarData as any, date, start, end);
    expect(result.hasConflict).toBe(true);
    expect(result.conflictingEvent).toHaveProperty('start');
    expect(result.conflictingEvent).toHaveProperty('end');
  });
});

// ─── extractTimeChangeRequest ────────────────────────────────────────────────

describe('validateSchedulePlacementRules', () => {
  const makePlacementSlot = (
    dateStr: string,
    startTime: string,
    endTime: string,
    lessonTitle = 'Sesion base',
  ): StudyPlannerStoredLessonDistribution => ({
    clientReferenceId: `${dateStr}-${startTime}`,
    dateStr,
    dayName: 'Viernes',
    startTime,
    endTime,
    lessons: [
      {
        courseTitle: 'Curso',
        lessonTitle,
        lessonOrderIndex: 1,
        durationMinutes: 60,
      },
    ],
  });

  it('rejects overlap with another study session', () => {
    const existing = makePlacementSlot('2026-04-10', '10:00', '11:00', 'Sesion existente');
    const target = {
      ...makePlacementSlot('2026-04-10', '10:30', '11:30', 'Sesion nueva'),
      clientReferenceId: 'candidate',
    };

    const result = validateSchedulePlacementRules({
      savedCalendarData: null,
      savedLessonDistribution: [existing, target],
      targetSlot: target,
    });

    expect(result.valid).toBe(false);
    expect(result.message).toContain('Sesion existente');
  });

  it('rejects overlap with a non-work event', () => {
    const target = makePlacementSlot('2026-04-10', '10:00', '11:00');
    const result = validateSchedulePlacementRules({
      savedCalendarData: {
        '2026-04-10': {
          busySlots: [],
          events: [
            {
              title: 'Consulta medica',
              start: '2026-04-10T10:00:00',
              end: '2026-04-10T11:00:00',
            },
          ],
        },
      } as any,
      savedLessonDistribution: [target],
      targetSlot: target,
    });

    expect(result.valid).toBe(false);
    expect(result.message).toContain('Consulta medica');
  });

  it('rejects time outside work block when there is no explicit permission', () => {
    const target = makePlacementSlot('2026-04-10', '18:00', '19:00');
    const result = validateSchedulePlacementRules({
      savedCalendarData: {
        '2026-04-10': {
          busySlots: [],
          events: [
            {
              title: 'Trabajo',
              start: '2026-04-10T09:00:00',
              end: '2026-04-10T17:00:00',
            },
          ],
        },
      } as any,
      savedLessonDistribution: [target],
      targetSlot: target,
      userMessage: 'mueve esto al viernes 10',
    });

    expect(result.valid).toBe(false);
    expect(result.message).toContain('bloques de trabajo');
  });

  it('allows rest-day placement when the user explicitly requests sunday', () => {
    const target = makePlacementSlot('2026-04-12', '10:00', '11:00');
    const result = validateSchedulePlacementRules({
      savedCalendarData: {
        '2026-04-12': {
          busySlots: [],
          events: [],
        },
      } as any,
      savedLessonDistribution: [target],
      targetSlot: target,
      userMessage: 'muevelo al domingo aunque sea mi descanso',
    });

    expect(result.valid).toBe(true);
  });
});

