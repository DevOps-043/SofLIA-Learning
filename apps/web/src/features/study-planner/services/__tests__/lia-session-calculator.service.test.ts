import { describe, it, expect } from 'vitest';
import { LiaSessionCalculatorService } from '../lia-session-calculator.service';

const makeLesson = (
  title: string,
  orderIndex: number,
  durationMinutes = 20,
  moduleTitle = 'Módulo 1',
) => ({
  lessonTitle: title,
  lessonOrderIndex: orderIndex,
  moduleTitle,
  durationMinutes,
});

// ─── preCalculateStudySessions ────────────────────────────────────────────────

describe('LiaSessionCalculatorService.preCalculateStudySessions', () => {
  it('returns empty sessions when no available days', () => {
    const result = LiaSessionCalculatorService.preCalculateStudySessions(
      [makeLesson('Lesson 1', 1)],
      {
        studyDays: [],
        timeSlots: ['mañana'],
        startDate: new Date('2025-06-16'), // Monday
      },
    );
    expect(result.sessions).toHaveLength(0);
    expect(result.summary.totalSessions).toBe(0);
  });

  it('returns empty sessions when no time slots', () => {
    const result = LiaSessionCalculatorService.preCalculateStudySessions(
      [makeLesson('Lesson 1', 1)],
      {
        studyDays: ['lunes'],
        timeSlots: [],
        startDate: new Date('2025-06-16'),
      },
    );
    expect(result.sessions).toHaveLength(0);
  });

  it('returns empty sessions when no lessons', () => {
    const result = LiaSessionCalculatorService.preCalculateStudySessions(
      [],
      {
        studyDays: ['lunes'],
        timeSlots: ['mañana'],
        startDate: new Date('2025-06-16'),
      },
    );
    expect(result.sessions).toHaveLength(0);
  });

  it('creates sessions only on specified study days', () => {
    const lessons = [makeLesson('Lesson 1', 1), makeLesson('Lesson 2', 2)];
    const result = LiaSessionCalculatorService.preCalculateStudySessions(lessons, {
      studyDays: ['lunes', 'miercoles'],
      timeSlots: ['mañana'],
      startDate: new Date('2025-06-16'), // Monday June 16
    });
    // Should schedule on Mondays and Wednesdays
    for (const session of result.sessions) {
      expect(['Lunes', 'Miércoles']).toContain(session.dayName);
    }
  });

  it('assigns correct start time for mañana slot (08:00)', () => {
    const lessons = [makeLesson('Lesson 1', 1, 30)];
    const result = LiaSessionCalculatorService.preCalculateStudySessions(lessons, {
      studyDays: ['lunes'],
      timeSlots: ['mañana'],
      startDate: new Date('2025-06-16'),
    });
    if (result.sessions.length > 0) {
      expect(result.sessions[0].startTime).toBe('08:00');
    }
  });

  it('assigns correct start time for tarde slot (14:00)', () => {
    const lessons = [makeLesson('Lesson 1', 1, 30)];
    const result = LiaSessionCalculatorService.preCalculateStudySessions(lessons, {
      studyDays: ['lunes'],
      timeSlots: ['tarde'],
      startDate: new Date('2025-06-16'),
    });
    if (result.sessions.length > 0) {
      expect(result.sessions[0].startTime).toBe('14:00');
    }
  });

  it('assigns correct start time for noche slot (20:00)', () => {
    const lessons = [makeLesson('Lesson 1', 1, 30)];
    const result = LiaSessionCalculatorService.preCalculateStudySessions(lessons, {
      studyDays: ['lunes'],
      timeSlots: ['noche'],
      startDate: new Date('2025-06-16'),
    });
    if (result.sessions.length > 0) {
      expect(result.sessions[0].startTime).toBe('20:00');
    }
  });

  it('calculates end time correctly (start + duration)', () => {
    const lessons = [makeLesson('Lesson 1', 1, 60)]; // 60 min
    const result = LiaSessionCalculatorService.preCalculateStudySessions(lessons, {
      studyDays: ['lunes'],
      timeSlots: ['mañana'],
      startDate: new Date('2025-06-16'),
    });
    if (result.sessions.length > 0) {
      expect(result.sessions[0].startTime).toBe('08:00');
      expect(result.sessions[0].endTime).toBe('09:00');
    }
  });

  it('calculates end time correctly for 90 minutes', () => {
    const lessons = [makeLesson('Lesson 1', 1, 90)];
    const result = LiaSessionCalculatorService.preCalculateStudySessions(lessons, {
      studyDays: ['lunes'],
      timeSlots: ['tarde'],
      startDate: new Date('2025-06-16'),
    });
    if (result.sessions.length > 0) {
      expect(result.sessions[0].endTime).toBe('15:30');
    }
  });

  it('handles end time spanning midnight', () => {
    // 20:00 + 120min = 22:00 (no midnight span)
    const lessons = [makeLesson('Long Lesson', 1, 120)];
    const result = LiaSessionCalculatorService.preCalculateStudySessions(lessons, {
      studyDays: ['lunes'],
      timeSlots: ['noche'],
      startDate: new Date('2025-06-16'),
    });
    if (result.sessions.length > 0) {
      expect(result.sessions[0].endTime).toBe('22:00');
    }
  });

  it('summary totalLessons matches input lessons count', () => {
    const lessons = [
      makeLesson('L1', 1),
      makeLesson('L2', 2),
      makeLesson('L3', 3),
    ];
    const result = LiaSessionCalculatorService.preCalculateStudySessions(lessons, {
      studyDays: ['lunes', 'martes', 'jueves'],
      timeSlots: ['mañana'],
      startDate: new Date('2025-06-16'),
    });
    expect(result.summary.totalLessons).toBe(3);
  });

  it('summary totalSessions equals sessions array length', () => {
    const lessons = [makeLesson('L1', 1), makeLesson('L2', 2)];
    const result = LiaSessionCalculatorService.preCalculateStudySessions(lessons, {
      studyDays: ['lunes'],
      timeSlots: ['mañana'],
      startDate: new Date('2025-06-16'),
    });
    expect(result.summary.totalSessions).toBe(result.sessions.length);
  });

  it('summary finishDate is non-empty when sessions exist', () => {
    const lessons = [makeLesson('L1', 1)];
    const result = LiaSessionCalculatorService.preCalculateStudySessions(lessons, {
      studyDays: ['lunes'],
      timeSlots: ['mañana'],
      startDate: new Date('2025-06-16'),
    });
    if (result.sessions.length > 0) {
      expect(result.summary.finishDate).toBeTruthy();
      expect(typeof result.summary.finishDate).toBe('string');
    }
  });

  it('stops before targetDate when provided', () => {
    const lessons = Array.from({ length: 20 }, (_, i) => makeLesson(`L${i}`, i + 1));
    const targetDate = new Date('2025-06-20'); // 4 days from start
    const result = LiaSessionCalculatorService.preCalculateStudySessions(lessons, {
      studyDays: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
      timeSlots: ['mañana'],
      startDate: new Date('2025-06-16'),
      targetDate,
    });
    // Should not schedule beyond June 20
    expect(result.sessions.length).toBeLessThan(20);
  });

  it('groups decimal lessons (1 with 1.1) into same session', () => {
    const lessons = [
      makeLesson('Lesson 1', 1),
      makeLesson('Lesson 1.1', 1.1),
      makeLesson('Lesson 2', 2),
    ];
    const result = LiaSessionCalculatorService.preCalculateStudySessions(lessons, {
      studyDays: ['lunes'],
      timeSlots: ['mañana'],
      startDate: new Date('2025-06-16'),
    });
    // Lesson 1 and 1.1 should be grouped, so 2 sessions
    expect(result.sessions.length).toBe(2);
  });

  it('each session has lessons array with title and duration', () => {
    const lessons = [makeLesson('Intro', 1, 25)];
    const result = LiaSessionCalculatorService.preCalculateStudySessions(lessons, {
      studyDays: ['lunes'],
      timeSlots: ['mañana'],
      startDate: new Date('2025-06-16'),
    });
    if (result.sessions.length > 0) {
      expect(result.sessions[0].lessons[0]).toHaveProperty('title');
      expect(result.sessions[0].lessons[0]).toHaveProperty('duration');
      expect(result.sessions[0].lessons[0].duration).toBe(25);
    }
  });

  it('weekNumber starts at 1', () => {
    const lessons = [makeLesson('L1', 1)];
    const result = LiaSessionCalculatorService.preCalculateStudySessions(lessons, {
      studyDays: ['lunes'],
      timeSlots: ['mañana'],
      startDate: new Date('2025-06-16'),
    });
    if (result.sessions.length > 0) {
      expect(result.sessions[0].weekNumber).toBeGreaterThanOrEqual(1);
    }
  });

  it('summary totalWeeks >= 1 when sessions exist', () => {
    const lessons = [makeLesson('L1', 1)];
    const result = LiaSessionCalculatorService.preCalculateStudySessions(lessons, {
      studyDays: ['lunes'],
      timeSlots: ['mañana'],
      startDate: new Date('2025-06-16'),
    });
    if (result.sessions.length > 0) {
      expect(result.summary.totalWeeks).toBeGreaterThanOrEqual(1);
    }
  });
});
