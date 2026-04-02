import { describe, it, expect } from 'vitest';
import { StudyStrategyService } from '../study-strategy.service';
import type { StudyMode } from '../study-strategy.service';

describe('StudyStrategyService.getConfig', () => {
  it('returns default pomodoro config', () => {
    const cfg = StudyStrategyService.getConfig('pomodoro');
    expect(cfg.maxStudyBlockMinutes).toBe(25);
    expect(cfg.shortBreakMinutes).toBe(5);
    expect(cfg.longBreakMinutes).toBe(15);
    expect(cfg.pomodorosBeforeLongBreak).toBe(4);
  });

  it('returns default balanced config', () => {
    const cfg = StudyStrategyService.getConfig('balanced');
    expect(cfg.maxStudyBlockMinutes).toBe(45);
  });

  it('returns default intensive config', () => {
    const cfg = StudyStrategyService.getConfig('intensive');
    expect(cfg.maxStudyBlockMinutes).toBe(60);
    expect(cfg.shortBreakMinutes).toBe(3);
  });

  it('merges custom config on top of defaults', () => {
    const cfg = StudyStrategyService.getConfig('pomodoro', { shortBreakMinutes: 10 });
    expect(cfg.shortBreakMinutes).toBe(10);
    expect(cfg.longBreakMinutes).toBe(15); // untouched default
  });
});

describe('StudyStrategyService.calculatePomodoroBreaks', () => {
  it('returns correct structure', () => {
    const result = StudyStrategyService.calculatePomodoroBreaks(50);
    expect(result).toHaveProperty('studyMinutes', 50);
    expect(result).toHaveProperty('breaks');
    expect(result).toHaveProperty('totalMinutes');
    expect(result).toHaveProperty('breakMinutes');
    expect(result).toHaveProperty('pomodoroCount');
  });

  it('studyMinutes equals input', () => {
    expect(StudyStrategyService.calculatePomodoroBreaks(60).studyMinutes).toBe(60);
    expect(StudyStrategyService.calculatePomodoroBreaks(120).studyMinutes).toBe(120);
  });

  it('totalMinutes = studyMinutes + breakMinutes', () => {
    const r = StudyStrategyService.calculatePomodoroBreaks(90);
    expect(r.totalMinutes).toBe(r.studyMinutes + r.breakMinutes);
  });

  it('short session has fewer breaks than long session', () => {
    const short = StudyStrategyService.calculatePomodoroBreaks(25);
    const long = StudyStrategyService.calculatePomodoroBreaks(200);
    expect(long.breaks.length).toBeGreaterThan(short.breaks.length);
  });

  it('every 4th pomodoro produces a long break', () => {
    const result = StudyStrategyService.calculatePomodoroBreaks(200);
    const longBreaks = result.breaks.filter(b => b.type === 'long');
    expect(longBreaks.length).toBeGreaterThan(0);
  });

  it('break types are short or long', () => {
    const result = StudyStrategyService.calculatePomodoroBreaks(150);
    for (const b of result.breaks) {
      expect(['short', 'long']).toContain(b.type);
    }
  });

  it('each break has afterMinutes and durationMinutes', () => {
    const result = StudyStrategyService.calculatePomodoroBreaks(100);
    for (const b of result.breaks) {
      expect(b.afterMinutes).toBeGreaterThan(0);
      expect(b.durationMinutes).toBeGreaterThan(0);
    }
  });
});

describe('StudyStrategyService.calculateBalancedBreaks', () => {
  it('no internal break for 20 min session', () => {
    const result = StudyStrategyService.calculateBalancedBreaks(20);
    // <=20min: no break added
    expect(result.breakMinutes).toBe(0);
    expect(result.breaks).toHaveLength(0);
  });

  it('micro break added for 25 min session', () => {
    const result = StudyStrategyService.calculateBalancedBreaks(25);
    expect(result.breaks.length).toBeGreaterThan(0);
    expect(result.breaks[0].type).toBe('micro');
  });

  it('one break at midpoint for 45 min session', () => {
    const result = StudyStrategyService.calculateBalancedBreaks(45);
    expect(result.breaks).toHaveLength(1);
    expect(result.breaks[0].type).toBe('short');
    expect(result.breaks[0].afterMinutes).toBe(22); // floor(45/2)
  });

  it('multiple breaks for 90 min session', () => {
    const result = StudyStrategyService.calculateBalancedBreaks(90);
    expect(result.breaks.length).toBeGreaterThan(1);
  });

  it('long breaks for sessions > 90 min', () => {
    const result = StudyStrategyService.calculateBalancedBreaks(120);
    const longBreaks = result.breaks.filter(b => b.type === 'long');
    expect(longBreaks.length).toBeGreaterThan(0);
  });

  it('totalMinutes = studyMinutes + breakMinutes', () => {
    const r = StudyStrategyService.calculateBalancedBreaks(60);
    expect(r.totalMinutes).toBe(r.studyMinutes + r.breakMinutes);
  });
});

describe('StudyStrategyService.calculateIntensiveBreaks', () => {
  it('no breaks for session <= 60 min', () => {
    const r30 = StudyStrategyService.calculateIntensiveBreaks(30);
    const r60 = StudyStrategyService.calculateIntensiveBreaks(60);
    expect(r30.breaks).toHaveLength(0);
    expect(r60.breaks).toHaveLength(0);
    expect(r30.breakMinutes).toBe(0);
    expect(r60.breakMinutes).toBe(0);
  });

  it('adds break for session > 60 min', () => {
    const result = StudyStrategyService.calculateIntensiveBreaks(90);
    expect(result.breaks.length).toBeGreaterThan(0);
  });

  it('every 2nd break is a long break', () => {
    const result = StudyStrategyService.calculateIntensiveBreaks(200);
    const longBreaks = result.breaks.filter(b => b.type === 'long');
    expect(longBreaks.length).toBeGreaterThan(0);
  });

  it('totalMinutes = studyMinutes + breakMinutes', () => {
    const r = StudyStrategyService.calculateIntensiveBreaks(180);
    expect(r.totalMinutes).toBe(r.studyMinutes + r.breakMinutes);
  });
});

describe('StudyStrategyService.calculateBreaks (dispatcher)', () => {
  const modes: StudyMode[] = ['pomodoro', 'balanced', 'intensive'];
  for (const mode of modes) {
    it(`delegates to correct method for mode "${mode}"`, () => {
      const result = StudyStrategyService.calculateBreaks(90, mode);
      expect(result.studyMinutes).toBe(90);
      expect(result).toHaveProperty('breaks');
    });
  }

  it('falls back to balanced for unknown mode', () => {
    const balanced = StudyStrategyService.calculateBalancedBreaks(60);
    const unknown = StudyStrategyService.calculateBreaks(60, 'unknown' as StudyMode);
    expect(unknown.studyMinutes).toBe(balanced.studyMinutes);
    expect(unknown.breakMinutes).toBe(balanced.breakMinutes);
  });
});

describe('StudyStrategyService.validateDailyStudyLoad', () => {
  it('returns valid with zero sessions', () => {
    const result = StudyStrategyService.validateDailyStudyLoad([]);
    expect(result.isValid).toBe(true);
    expect(result.totalStudyMinutes).toBe(0);
    expect(result.consecutiveBlocks).toBe(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('calculates total study minutes correctly', () => {
    const base = new Date('2025-01-15T09:00:00');
    const sessions = [
      { startTime: new Date('2025-01-15T09:00:00'), endTime: new Date('2025-01-15T10:00:00'), durationMinutes: 60 },
      { startTime: new Date('2025-01-15T11:00:00'), endTime: new Date('2025-01-15T12:00:00'), durationMinutes: 60 },
    ];
    const result = StudyStrategyService.validateDailyStudyLoad(sessions);
    expect(result.totalStudyMinutes).toBe(120);
  });

  it('returns warnings and suggestions arrays', () => {
    const sessions = [
      { startTime: new Date('2025-01-15T09:00:00'), endTime: new Date('2025-01-15T12:00:00'), durationMinutes: 180 },
    ];
    const result = StudyStrategyService.validateDailyStudyLoad(sessions);
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(Array.isArray(result.suggestions)).toBe(true);
  });

  it('sorts sessions by startTime internally', () => {
    const sessions = [
      { startTime: new Date('2025-01-15T14:00:00'), endTime: new Date('2025-01-15T15:00:00'), durationMinutes: 60 },
      { startTime: new Date('2025-01-15T09:00:00'), endTime: new Date('2025-01-15T10:00:00'), durationMinutes: 60 },
    ];
    // Should not throw
    const result = StudyStrategyService.validateDailyStudyLoad(sessions);
    expect(result.totalStudyMinutes).toBe(120);
  });
});
