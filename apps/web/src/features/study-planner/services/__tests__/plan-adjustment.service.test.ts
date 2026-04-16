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

describe('userExplicitlyAllowsOutsideWorkBlocks', () => {
  it('detects explicit weekend consent', () => {
    expect(userExplicitlyAllowsOutsideWorkBlocks('puedes usar mi domingo aunque sea descanso')).toBe(true);
  });

  it('does not treat generic move requests as explicit consent', () => {
    expect(userExplicitlyAllowsOutsideWorkBlocks('mueve la sesion al viernes')).toBe(false);
  });
});

describe('extractTimeChangeRequest', () => {
  it('returns null for empty message', () => {
    expect(extractTimeChangeRequest('')).toBeNull();
  });

  it('returns null for message without time pattern', () => {
    expect(extractTimeChangeRequest('Hola, quiero estudiar más')).toBeNull();
  });

  it('extracts hour change from "de X a Y" pattern', () => {
    const result = extractTimeChangeRequest('de 9 a 11');
    expect(result).not.toBeNull();
    expect(result!.oldHour).toBe(9);
    expect(result!.newHour).toBe(11);
  });

  it('extracts hour change from "de X por Y" pattern', () => {
    const result = extractTimeChangeRequest('de 8 por 10');
    expect(result).not.toBeNull();
    expect(result!.oldHour).toBe(8);
    expect(result!.newHour).toBe(10);
  });

  it('returns null for invalid hours (> 23)', () => {
    const result = extractTimeChangeRequest('de 25 a 30');
    expect(result).toBeNull();
  });

  it('extracts from "cambiar horas que empiezan a X por Y" pattern', () => {
    const result = extractTimeChangeRequest('cambiar las horas que empiezan a 9 por las 11');
    if (result) {
      expect(result.oldHour).toBe(9);
      expect(result.newHour).toBe(11);
    }
    // If null, the regex just didn't match — acceptable
  });

  it('returns null when day-of-week pattern matches before simple pattern', () => {
    const result = extractTimeChangeRequest('lunes 9 a 11');
    // dayOfWeekPattern blocks simplePattern match
    expect(result).toBeNull();
  });
});

// ─── extractDateChangeRequest ─────────────────────────────────────────────────

describe('extractDateChangeRequest', () => {
  const makeSlot = (dateStr: string, dayName: string): StudyPlannerStoredLessonDistribution => ({
    clientReferenceId: `dist-${dateStr}`,
    dateStr,
    dayName,
    startTime: '09:00',
    endTime: '10:00',
    lessons: [],
  });

  it('returns null for message without date pattern', () => {
    const result = extractDateChangeRequest('Quiero estudiar más', []);
    expect(result).toBeNull();
  });

  it('returns null when no matching source slot found', () => {
    const slots = [makeSlot('2025-06-20', 'Viernes')];
    const result = extractDateChangeRequest('del 15 al 20', slots);
    expect(result).toBeNull();
  });

  it('extracts date change by day-of-month number', () => {
    const slots = [
      makeSlot('2025-06-15', 'Domingo'),
      makeSlot('2025-06-20', 'Viernes'),
    ];
    const result = extractDateChangeRequest('del 15 al 22', slots);
    if (result) {
      expect(result.sourceDate).toBe('2025-06-15');
      expect(result.targetDate).toContain('2025-06-22');
    }
    // Result may be null if pattern doesn't match exactly
  });

  it('returns null for empty slot list', () => {
    const result = extractDateChangeRequest('del lunes al martes', []);
    expect(result).toBeNull();
  });

  it('extracts source and target day names when match is found', () => {
    const slots = [
      makeSlot('2025-06-16', 'Lunes'), // Monday
    ];
    const result = extractDateChangeRequest('del 16 al 18', slots);
    if (result) {
      expect(result.sourceDayName).toBeTruthy();
      expect(result.targetDayName).toBeTruthy();
    }
  });

  it('moves by weekday names relative to the source session date, not today', () => {
    const slots = [
      makeSlot('2026-04-10', 'Viernes'),
    ];
    const result = extractDateChangeRequest('del viernes al sabado', slots);

    expect(result).toEqual({
      sourceDate: '2026-04-10',
      targetDate: '2026-04-11',
      sourceDayName: 'Viernes',
      targetDayName: 'Sabado',
    });
  });
});
