import { describe, it, expect } from 'vitest';
import { LiaPromptFormatterService } from '../lia-prompt-formatter.service';

describe('LiaPromptFormatterService.formatPreCalculatedSessionsForPrompt', () => {
  const makeSession = (weekNumber: number, dayName: string, date: string) => ({
    weekNumber,
    dayName,
    date,
    timeSlot: 'mañana',
    startTime: '08:00',
    endTime: '09:00',
    totalMinutes: 60,
    lessons: [{ title: 'Lesson A', duration: 60 }],
  });

  it('returns empty string when no sessions', () => {
    const result = LiaPromptFormatterService.formatPreCalculatedSessionsForPrompt({
      sessions: [],
      summary: { totalWeeks: 0, totalSessions: 0, totalLessons: 0, finishDate: '' },
    });
    expect(result).toBe('');
  });

  it('includes PRE-CALCULADO header', () => {
    const result = LiaPromptFormatterService.formatPreCalculatedSessionsForPrompt({
      sessions: [makeSession(1, 'Lunes', '16 de junio')],
      summary: { totalWeeks: 1, totalSessions: 1, totalLessons: 1, finishDate: '16 de junio' },
    });
    expect(result).toContain('PRE-CALCULADO');
  });

  it('includes session start and end times', () => {
    const result = LiaPromptFormatterService.formatPreCalculatedSessionsForPrompt({
      sessions: [makeSession(1, 'Lunes', '16 de junio')],
      summary: { totalWeeks: 1, totalSessions: 1, totalLessons: 1, finishDate: '16 de junio' },
    });
    expect(result).toContain('08:00');
    expect(result).toContain('09:00');
  });

  it('includes lesson titles', () => {
    const result = LiaPromptFormatterService.formatPreCalculatedSessionsForPrompt({
      sessions: [makeSession(1, 'Lunes', '16 de junio')],
      summary: { totalWeeks: 1, totalSessions: 1, totalLessons: 1, finishDate: '16 de junio' },
    });
    expect(result).toContain('Lesson A');
  });

  it('includes summary with totalLessons and finishDate', () => {
    const result = LiaPromptFormatterService.formatPreCalculatedSessionsForPrompt({
      sessions: [makeSession(1, 'Lunes', '16 de junio')],
      summary: { totalWeeks: 1, totalSessions: 1, totalLessons: 5, finishDate: '30 de junio' },
    });
    expect(result).toContain('5');
    expect(result).toContain('30 de junio');
  });

  it('groups sessions by week number', () => {
    const sessions = [
      makeSession(1, 'Lunes', '16 de junio'),
      makeSession(2, 'Lunes', '23 de junio'),
    ];
    const result = LiaPromptFormatterService.formatPreCalculatedSessionsForPrompt({
      sessions,
      summary: { totalWeeks: 2, totalSessions: 2, totalLessons: 2, finishDate: '23 de junio' },
    });
    expect(result).toContain('Semana 1');
    expect(result).toContain('Semana 2');
  });

  it('mentions day name in output', () => {
    const result = LiaPromptFormatterService.formatPreCalculatedSessionsForPrompt({
      sessions: [makeSession(1, 'Miércoles', '18 de junio')],
      summary: { totalWeeks: 1, totalSessions: 1, totalLessons: 1, finishDate: '18 de junio' },
    });
    expect(result).toContain('Miércoles');
  });
});
