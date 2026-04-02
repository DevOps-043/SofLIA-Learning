import { describe, it, expect } from 'vitest';
import {
  calculateDeadlineSuggestions,
  formatDuration,
} from '../course-deadline-calculator';
import type { CourseMetadata } from '../course-deadline-calculator';

// ─── formatDuration ───────────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('returns days for < 7 days (singular)', () => {
    expect(formatDuration(1)).toBe('1 día');
  });

  it('returns days for < 7 days (plural)', () => {
    expect(formatDuration(5)).toBe('5 días');
  });

  it('returns days for exactly 6 days', () => {
    expect(formatDuration(6)).toBe('6 días');
  });

  it('returns weeks for 7 days (singular)', () => {
    expect(formatDuration(7)).toBe('1 semana');
  });

  it('returns weeks for multiple weeks', () => {
    expect(formatDuration(14)).toBe('2 semanas');
    expect(formatDuration(21)).toBe('3 semanas');
    expect(formatDuration(28)).toBe('4 semanas');
  });

  it('returns months for >= 5 weeks (35 days)', () => {
    expect(formatDuration(35)).toBe('2 meses'); // ceil(35/30)=2
  });

  it('returns months singular for 30 days', () => {
    expect(formatDuration(30)).toBe('1 mes');
  });

  it('returns months for large durations', () => {
    expect(formatDuration(90)).toBe('3 meses');
    expect(formatDuration(120)).toBe('4 meses');
  });
});

// ─── calculateDeadlineSuggestions ────────────────────────────────────────────

const makeMetadata = (overrides: Partial<CourseMetadata> = {}): CourseMetadata => ({
  duration_total_minutes: 120, // 2 hours
  lesson_count: 10,
  activity_count: 5,
  material_count: 3,
  ...overrides,
});

describe('calculateDeadlineSuggestions', () => {
  const startDate = new Date('2025-06-16T00:00:00');

  it('returns result with course_id and course_title', () => {
    const result = calculateDeadlineSuggestions('c-1', 'Intro to AI', makeMetadata(), startDate);
    expect(result.course_id).toBe('c-1');
    expect(result.course_title).toBe('Intro to AI');
  });

  it('returns exactly 3 suggestions', () => {
    const result = calculateDeadlineSuggestions('c-1', 'Course', makeMetadata(), startDate);
    expect(result.suggestions).toHaveLength(3);
  });

  it('suggestions have approaches: fast, balanced, long', () => {
    const result = calculateDeadlineSuggestions('c-1', 'Course', makeMetadata(), startDate);
    const approaches = result.suggestions.map(s => s.approach);
    expect(approaches).toContain('fast');
    expect(approaches).toContain('balanced');
    expect(approaches).toContain('long');
  });

  it('includes metadata in result', () => {
    const meta = makeMetadata();
    const result = calculateDeadlineSuggestions('c-1', 'Course', meta, startDate);
    expect(result.metadata).toEqual(meta);
  });

  it('has calculated_at as ISO string', () => {
    const result = calculateDeadlineSuggestions('c-1', 'Course', makeMetadata(), startDate);
    expect(result.calculated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('fast approach has shorter deadline than balanced', () => {
    const result = calculateDeadlineSuggestions('c-1', 'Course', makeMetadata(), startDate);
    const fast = result.suggestions.find(s => s.approach === 'fast')!;
    const balanced = result.suggestions.find(s => s.approach === 'balanced')!;
    expect(fast.duration_days).toBeLessThanOrEqual(balanced.duration_days);
  });

  it('balanced approach has shorter deadline than long', () => {
    const result = calculateDeadlineSuggestions('c-1', 'Course', makeMetadata(), startDate);
    const balanced = result.suggestions.find(s => s.approach === 'balanced')!;
    const long = result.suggestions.find(s => s.approach === 'long')!;
    expect(balanced.duration_days).toBeLessThanOrEqual(long.duration_days);
  });

  it('fast approach respects min 3 days', () => {
    // Very short course (1 minute)
    const meta = makeMetadata({ duration_total_minutes: 1 });
    const result = calculateDeadlineSuggestions('c-1', 'Course', meta, startDate);
    const fast = result.suggestions.find(s => s.approach === 'fast')!;
    expect(fast.duration_days).toBeGreaterThanOrEqual(3);
  });

  it('fast approach respects max 21 days', () => {
    // Medium course
    const meta = makeMetadata({ duration_total_minutes: 300 });
    const result = calculateDeadlineSuggestions('c-1', 'Course', meta, startDate);
    const fast = result.suggestions.find(s => s.approach === 'fast')!;
    expect(fast.duration_days).toBeLessThanOrEqual(21);
  });

  it('balanced approach respects min 7 days', () => {
    const meta = makeMetadata({ duration_total_minutes: 10 });
    const result = calculateDeadlineSuggestions('c-1', 'Course', meta, startDate);
    const balanced = result.suggestions.find(s => s.approach === 'balanced')!;
    expect(balanced.duration_days).toBeGreaterThanOrEqual(7);
  });

  it('balanced approach respects max 60 days', () => {
    const meta = makeMetadata({ duration_total_minutes: 600 });
    const result = calculateDeadlineSuggestions('c-1', 'Course', meta, startDate);
    const balanced = result.suggestions.find(s => s.approach === 'balanced')!;
    expect(balanced.duration_days).toBeLessThanOrEqual(60);
  });

  it('long approach respects min 14 days', () => {
    const meta = makeMetadata({ duration_total_minutes: 10 });
    const result = calculateDeadlineSuggestions('c-1', 'Course', meta, startDate);
    const long = result.suggestions.find(s => s.approach === 'long')!;
    expect(long.duration_days).toBeGreaterThanOrEqual(14);
  });

  it('long approach respects max 120 days', () => {
    const meta = makeMetadata({ duration_total_minutes: 3000 });
    const result = calculateDeadlineSuggestions('c-1', 'Course', meta, startDate);
    const long = result.suggestions.find(s => s.approach === 'long')!;
    expect(long.duration_days).toBeLessThanOrEqual(120);
  });

  it('deadline_date is ISO date string after startDate', () => {
    const result = calculateDeadlineSuggestions('c-1', 'Course', makeMetadata(), startDate);
    for (const suggestion of result.suggestions) {
      const deadline = new Date(suggestion.deadline_date);
      expect(deadline.getTime()).toBeGreaterThan(startDate.getTime());
    }
  });

  it('duration_weeks = ceil(duration_days / 7)', () => {
    const result = calculateDeadlineSuggestions('c-1', 'Course', makeMetadata(), startDate);
    for (const suggestion of result.suggestions) {
      const expectedWeeks = Math.ceil(suggestion.duration_days / 7);
      expect(suggestion.duration_weeks).toBe(expectedWeeks);
    }
  });

  it('each suggestion has hours_per_week and description', () => {
    const result = calculateDeadlineSuggestions('c-1', 'Course', makeMetadata(), startDate);
    for (const suggestion of result.suggestions) {
      expect(suggestion.hours_per_week).toBeGreaterThan(0);
      expect(typeof suggestion.description).toBe('string');
      expect(suggestion.description.length).toBeGreaterThan(0);
    }
  });

  it('applies activity complexity adjustment (+15%) when activity_count > lesson_count * 2', () => {
    const baseResult = calculateDeadlineSuggestions(
      'c-1',
      'Course',
      makeMetadata({ activity_count: 5, lesson_count: 10 }),
      startDate,
    );
    const complexResult = calculateDeadlineSuggestions(
      'c-1',
      'Course',
      makeMetadata({ activity_count: 25, lesson_count: 10 }), // 25 > 10*2
      startDate,
    );
    const baseFast = baseResult.suggestions.find(s => s.approach === 'fast')!;
    const complexFast = complexResult.suggestions.find(s => s.approach === 'fast')!;
    expect(complexFast.duration_days).toBeGreaterThanOrEqual(baseFast.duration_days);
  });

  it('uses today as startDate when not provided', () => {
    const result = calculateDeadlineSuggestions('c-1', 'Course', makeMetadata());
    const today = new Date();
    for (const suggestion of result.suggestions) {
      const deadline = new Date(suggestion.deadline_date);
      expect(deadline.getTime()).toBeGreaterThan(today.getTime() - 60000); // 1 min buffer
    }
  });

  it('each suggestion has estimated_completion_rate', () => {
    const result = calculateDeadlineSuggestions('c-1', 'Course', makeMetadata(), startDate);
    for (const suggestion of result.suggestions) {
      expect(suggestion.estimated_completion_rate).toMatch(/\d+%/);
    }
  });
});
