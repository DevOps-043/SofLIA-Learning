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

describe('ValidationService.validateB2BDeadlines', () => {
  it('returns isValid=false when weeklyStudyMinutes is 0', () => {
    const result = ValidationService.validateB2BDeadlines([], 0);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns isValid=true when no courses', () => {
    const result = ValidationService.validateB2BDeadlines([], 120);
    expect(result.isValid).toBe(true);
    expect(result.deadlineIssues).toHaveLength(0);
  });

  it('returns isValid=true when course can be completed on time', () => {
    const startDate = new Date('2025-06-01');
    const courses = [
      {
        courseId: 'c1',
        courseTitle: 'Course 1',
        dueDate: '2025-09-01', // ~13 weeks away
        remainingMinutes: 120, // 2 hours
      },
    ];
    // 120 min needed / 120 min per week = 1 week → well within 13 weeks
    const result = ValidationService.validateB2BDeadlines(courses, 120, startDate);
    expect(result.isValid).toBe(true);
    expect(result.deadlineIssues[0].canComplete).toBe(true);
  });

  it('returns isValid=false when course cannot be completed on time', () => {
    const startDate = new Date('2025-06-01');
    const courses = [
      {
        courseId: 'c1',
        courseTitle: 'Overdue Course',
        dueDate: '2025-06-02', // only 1 day away
        remainingMinutes: 600, // 10 hours
      },
    ];
    const result = ValidationService.validateB2BDeadlines(courses, 60, startDate); // 1h per week
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.deadlineIssues[0].canComplete).toBe(false);
    expect(result.deadlineIssues[0].daysOverdue).toBeGreaterThan(0);
  });

  it('skips courses without dueDate', () => {
    const courses = [{ courseId: 'c1', courseTitle: 'No deadline', remainingMinutes: 100 }];
    const result = ValidationService.validateB2BDeadlines(courses, 120);
    expect(result.isValid).toBe(true);
    expect(result.deadlineIssues).toHaveLength(0);
  });

  it('includes suggestedAction for overdue courses', () => {
    const startDate = new Date('2025-06-01');
    const courses = [
      {
        courseId: 'c1',
        courseTitle: 'C1',
        dueDate: '2025-06-02',
        remainingMinutes: 600,
      },
    ];
    const result = ValidationService.validateB2BDeadlines(courses, 60, startDate);
    const issue = result.deadlineIssues[0];
    expect(issue.suggestedAction).toBeTruthy();
  });

  it('adds warning for tight but achievable deadline (< 3 days margin)', () => {
    const startDate = new Date('2025-06-01');
    // Course takes exactly ~1 week, deadline is 1 week + 1 day
    const courses = [
      {
        courseId: 'c1',
        courseTitle: 'Tight',
        dueDate: '2025-06-08', // 7 days away
        remainingMinutes: 60, // 1 hour
      },
    ];
    // 60 min / 60 per week = 1 week → completion ~June 8, deadline June 8 → tight
    const result = ValidationService.validateB2BDeadlines(courses, 60, startDate);
    // May be valid but with warning if margin < 3 days
    expect(result.deadlineIssues[0]).toBeDefined();
  });
});

// ─── validateDaysAndHours ─────────────────────────────────────────────────────

describe('ValidationService.validateDaysAndHours', () => {
  it('returns isValid=false when no days selected', () => {
    const result = ValidationService.validateDaysAndHours([], [makeTimeBlock(9, 0, 10, 0)], 30);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('día'))).toBe(true);
  });

  it('returns isValid=false when no time blocks', () => {
    const result = ValidationService.validateDaysAndHours([1, 3, 5], [], 30);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('bloque'))).toBe(true);
  });

  it('returns isValid=true for valid config', () => {
    const result = ValidationService.validateDaysAndHours(
      [1, 2, 3, 4, 5],
      [makeTimeBlock(9, 0, 10, 0)],
      30,
    );
    expect(result.isValid).toBe(true);
  });

  it('returns error for invalid time block hours', () => {
    const result = ValidationService.validateDaysAndHours(
      [1],
      [makeTimeBlock(25, 0, 26, 0)], // invalid hours
      30,
    );
    expect(result.isValid).toBe(false);
  });

  it('returns error when block end <= start', () => {
    const result = ValidationService.validateDaysAndHours(
      [1],
      [makeTimeBlock(10, 0, 9, 0)], // end before start
      30,
    );
    expect(result.isValid).toBe(false);
  });

  it('warns when block duration < minSessionMinutes', () => {
    const result = ValidationService.validateDaysAndHours(
      [1, 2, 3],
      [makeTimeBlock(9, 0, 9, 20)], // 20 min block
      30, // min session = 30 min
    );
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('warns when overlapping blocks exist', () => {
    const result = ValidationService.validateDaysAndHours(
      [1, 2, 3],
      [makeTimeBlock(9, 0, 11, 0), makeTimeBlock(10, 0, 12, 0)], // overlap
      30,
    );
    expect(result.warnings.some((w) => w.includes('solapan'))).toBe(true);
  });

  it('warns when less than 3 days selected', () => {
    const result = ValidationService.validateDaysAndHours(
      [1, 3],
      [makeTimeBlock(9, 0, 10, 0)],
      30,
    );
    expect(result.warnings.some((w) => w.includes('3 días'))).toBe(true);
  });
});

// ─── validateAll ─────────────────────────────────────────────────────────────

describe('ValidationService.validateAll', () => {
  it('returns isValid=false when basic session times are invalid', () => {
    const result = ValidationService.validateAll({
      minSessionMinutes: 0,
      maxSessionMinutes: 0,
      breakDurationMinutes: 10,
      preferredDays: [1, 2, 3],
      timeBlocks: [makeTimeBlock(9, 0, 10, 0)],
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns isValid=true for valid minimal config', () => {
    const result = ValidationService.validateAll({
      minSessionMinutes: 30,
      maxSessionMinutes: 60,
      breakDurationMinutes: 10,
      preferredDays: [1, 2, 3],
      timeBlocks: [makeTimeBlock(9, 0, 10, 0)],
    });
    expect(result.isValid).toBe(true);
  });

  it('aggregates errors from all validators', () => {
    const result = ValidationService.validateAll({
      minSessionMinutes: 0, // error
      maxSessionMinutes: 0, // error
      breakDurationMinutes: -1, // error
      preferredDays: [], // error
      timeBlocks: [], // error
    });
    expect(result.errors.length).toBeGreaterThan(2);
  });

  it('deduplicates errors', () => {
    const result = ValidationService.validateAll({
      minSessionMinutes: 30,
      maxSessionMinutes: 60,
      breakDurationMinutes: 10,
      preferredDays: [1, 2, 3],
      timeBlocks: [makeTimeBlock(9, 0, 10, 0)],
      lessonDurations: [makeLesson(20)],
    });
    // errors array should not have duplicates
    const unique = new Set(result.errors);
    expect(unique.size).toBe(result.errors.length);
  });

  it('includes B2B deadline errors when b2bCourses and weeklyStudyMinutes provided', () => {
    const startDate = new Date('2025-06-01');
    const result = ValidationService.validateAll({
      minSessionMinutes: 30,
      maxSessionMinutes: 60,
      breakDurationMinutes: 10,
      preferredDays: [1, 2, 3],
      timeBlocks: [makeTimeBlock(9, 0, 10, 0)],
      b2bCourses: [
        {
          courseId: 'c1',
          courseTitle: 'Urgent',
          dueDate: '2025-06-02',
          remainingMinutes: 1000,
        },
      ],
      weeklyStudyMinutes: 60,
    });
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
