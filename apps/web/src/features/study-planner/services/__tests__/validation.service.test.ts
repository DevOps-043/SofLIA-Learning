import { describe, it, expect } from 'vitest';
import { ValidationService } from '../validation.service';
import type { LessonDuration, TimeBlock, CalendarEvent } from '../../types/user-context.types';

// ─── helpers ──────────────────────────────────────────────────────────────────

const makeLesson = (totalMinutes: number, lessonId = 'l1'): LessonDuration => ({
  lessonId,
  lessonTitle: `Lesson ${lessonId}`,
  videoMinutes: totalMinutes,
  activitiesMinutes: 0,
  materialsMinutes: 0,
  interactionsMinutes: 0,
  totalMinutes,
  isEstimated: false,
});

const makeCalendarEvent = (
  startTime: string,
  endTime: string,
  title = 'Event',
  status: 'confirmed' | 'tentative' | 'cancelled' = 'confirmed',
): CalendarEvent => ({
  id: `event-${startTime}`,
  title,
  startTime,
  endTime,
  status,
});

const makeTimeBlock = (
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
): TimeBlock => ({ startHour, startMinute, endHour, endMinute });

// ─── validateMinimumSessionTime ───────────────────────────────────────────────

describe('ValidationService.validateMinimumSessionTime', () => {
  it('returns isValid=true with warning when no lessons', () => {
    const result = ValidationService.validateMinimumSessionTime(30, []);
    expect(result.isValid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('returns isValid=true when session >= shortest lesson', () => {
    const lessons = [makeLesson(20, 'l1'), makeLesson(30, 'l2')];
    const result = ValidationService.validateMinimumSessionTime(25, lessons);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns isValid=false when session < shortest lesson', () => {
    const lessons = [makeLesson(30, 'l1')];
    const result = ValidationService.validateMinimumSessionTime(20, lessons);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('warns when session is very tight (slightly over min lesson)', () => {
    const lessons = [makeLesson(20, 'l1')];
    // 21 < 20 * 1.2 = 24, so warning
    const result = ValidationService.validateMinimumSessionTime(21, lessons);
    expect(result.isValid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('no warning when session is comfortably over min lesson', () => {
    const lessons = [makeLesson(20, 'l1')];
    const result = ValidationService.validateMinimumSessionTime(30, lessons);
    expect(result.warnings).toHaveLength(0);
  });
});

// ─── validateCalendarConflicts ────────────────────────────────────────────────

describe('ValidationService.validateCalendarConflicts', () => {
  it('returns isValid=true when no events', () => {
    const sessions = [{ startTime: '2025-07-01T09:00:00', endTime: '2025-07-01T10:00:00' }];
    const result = ValidationService.validateCalendarConflicts(sessions, []);
    expect(result.isValid).toBe(true);
  });

  it('returns isValid=true when no overlap', () => {
    const sessions = [{ startTime: '2025-07-01T09:00:00', endTime: '2025-07-01T10:00:00' }];
    const events = [makeCalendarEvent('2025-07-01T11:00:00', '2025-07-01T12:00:00')];
    const result = ValidationService.validateCalendarConflicts(sessions, events);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns isValid=false when session overlaps with confirmed event', () => {
    const sessions = [{ startTime: '2025-07-01T09:00:00', endTime: '2025-07-01T10:00:00', title: 'Study' }];
    const events = [makeCalendarEvent('2025-07-01T09:30:00', '2025-07-01T11:00:00', 'Meeting', 'confirmed')];
    const result = ValidationService.validateCalendarConflicts(sessions, events);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('adds warning for tentative event overlap', () => {
    const sessions = [{ startTime: '2025-07-01T09:00:00', endTime: '2025-07-01T10:00:00' }];
    const events = [makeCalendarEvent('2025-07-01T09:30:00', '2025-07-01T11:00:00', 'Maybe', 'tentative')];
    const result = ValidationService.validateCalendarConflicts(sessions, events);
    expect(result.isValid).toBe(true); // no confirmed conflict
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('skips cancelled events', () => {
    const sessions = [{ startTime: '2025-07-01T09:00:00', endTime: '2025-07-01T10:00:00' }];
    const events = [makeCalendarEvent('2025-07-01T09:30:00', '2025-07-01T11:00:00', 'Cancelled', 'cancelled')];
    const result = ValidationService.validateCalendarConflicts(sessions, events);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('adds suggestion when there are conflicts', () => {
    const sessions = [{ startTime: '2025-07-01T09:00:00', endTime: '2025-07-01T10:00:00' }];
    const events = [makeCalendarEvent('2025-07-01T09:00:00', '2025-07-01T10:00:00', 'Exact overlap')];
    const result = ValidationService.validateCalendarConflicts(sessions, events);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});

// ─── validateSessionTimes ─────────────────────────────────────────────────────

describe('ValidationService.validateSessionTimes', () => {
  it('returns isValid=true for valid range 15-60', () => {
    const result = ValidationService.validateSessionTimes(15, 60);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns isValid=false when min <= 0', () => {
    const result = ValidationService.validateSessionTimes(0, 60);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('mínimo'))).toBe(true);
  });

  it('returns isValid=false when max <= 0', () => {
    const result = ValidationService.validateSessionTimes(15, 0);
    expect(result.isValid).toBe(false);
  });

  it('returns isValid=false when min >= max', () => {
    const result = ValidationService.validateSessionTimes(60, 60);
    expect(result.isValid).toBe(false);
  });

  it('warns when min < 15', () => {
    const result = ValidationService.validateSessionTimes(10, 60);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.some((warning) => warning.includes('15 minutos'))).toBe(true);
  });

  it('warns when max > 120', () => {
    const result = ValidationService.validateSessionTimes(15, 130);
    expect(result.warnings.some((w) => w.includes('2 horas'))).toBe(true);
  });

  it('warns when max > 180', () => {
    const result = ValidationService.validateSessionTimes(15, 190);
    expect(result.warnings.some((w) => w.includes('3 horas'))).toBe(true);
  });
});

// ─── validateBreakTimes ───────────────────────────────────────────────────────

describe('ValidationService.validateBreakTimes', () => {
  it('returns isValid=true for valid break', () => {
    const result = ValidationService.validateBreakTimes(45, 10);
    expect(result.isValid).toBe(true);
  });

  it('returns isValid=false for negative break', () => {
    const result = ValidationService.validateBreakTimes(45, -1);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('warns for zero break time', () => {
    const result = ValidationService.validateBreakTimes(45, 0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('warns for too long break with short session (<=25 min)', () => {
    const result = ValidationService.validateBreakTimes(25, 15);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('warns for too short break with medium session (<=45 min)', () => {
    const result = ValidationService.validateBreakTimes(45, 3);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('warns for too short break with long session (<=90 min)', () => {
    const result = ValidationService.validateBreakTimes(90, 5);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('warns for too short break with very long session (>90 min)', () => {
    const result = ValidationService.validateBreakTimes(120, 10);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

// ─── validateB2BDeadlines ─────────────────────────────────────────────────────

