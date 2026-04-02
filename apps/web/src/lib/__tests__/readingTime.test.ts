import { describe, it, expect } from 'vitest';
import {
  countWords,
  calculateReadingTimeMinutes,
  calculateReadingTimeDetailed,
  getReadingTimeInfo,
  READING_SPEEDS,
  DEFAULT_READING_SPEED,
} from '../utils/readingTime';

// ─── countWords ───────────────────────────────────────────────────────────────

describe('countWords', () => {
  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0);
  });

  it('returns 0 for null/undefined', () => {
    expect(countWords(null as any)).toBe(0);
    expect(countWords(undefined as any)).toBe(0);
  });

  it('returns 0 for whitespace-only string', () => {
    expect(countWords('   ')).toBe(0);
    expect(countWords('\n\t')).toBe(0);
  });

  it('counts single word', () => {
    expect(countWords('hello')).toBe(1);
  });

  it('counts multiple words', () => {
    expect(countWords('hello world')).toBe(2);
    expect(countWords('one two three four')).toBe(4);
  });

  it('handles multiple spaces between words', () => {
    expect(countWords('hello   world')).toBe(2);
  });

  it('handles newlines as word separators', () => {
    expect(countWords('hello\nworld')).toBe(2);
  });

  it('handles tabs', () => {
    expect(countWords('hello\tworld')).toBe(2);
  });

  it('handles mixed whitespace', () => {
    expect(countWords('word1\n\n word2 \t word3')).toBe(3);
  });

  it('counts 100 words correctly', () => {
    const text = Array.from({ length: 100 }, (_, i) => `word${i}`).join(' ');
    expect(countWords(text)).toBe(100);
  });
});

// ─── READING_SPEEDS ───────────────────────────────────────────────────────────

describe('READING_SPEEDS', () => {
  it('defines slow, average, fast speeds', () => {
    expect(READING_SPEEDS).toHaveProperty('slow');
    expect(READING_SPEEDS).toHaveProperty('average');
    expect(READING_SPEEDS).toHaveProperty('fast');
  });

  it('slow speed is less than average', () => {
    expect(READING_SPEEDS.slow.wordsPerMinute).toBeLessThan(READING_SPEEDS.average.wordsPerMinute);
  });

  it('average speed is less than fast', () => {
    expect(READING_SPEEDS.average.wordsPerMinute).toBeLessThan(READING_SPEEDS.fast.wordsPerMinute);
  });

  it('each speed has label and description', () => {
    for (const speed of ['slow', 'average', 'fast'] as const) {
      expect(typeof READING_SPEEDS[speed].label).toBe('string');
      expect(typeof READING_SPEEDS[speed].description).toBe('string');
    }
  });
});

describe('DEFAULT_READING_SPEED', () => {
  it('is "slow" (educational content)', () => {
    expect(DEFAULT_READING_SPEED).toBe('slow');
  });
});

// ─── calculateReadingTimeMinutes ──────────────────────────────────────────────

describe('calculateReadingTimeMinutes', () => {
  it('returns 1 for empty text', () => {
    expect(calculateReadingTimeMinutes('')).toBe(1);
  });

  it('returns at least 1 minute for short text', () => {
    expect(calculateReadingTimeMinutes('hi')).toBeGreaterThanOrEqual(1);
  });

  it('uses slow speed by default', () => {
    const text = Array.from({ length: 180 }, () => 'word').join(' ');
    const result = calculateReadingTimeMinutes(text);
    expect(result).toBe(1); // 180 words / 180 wpm = 1 min
  });

  it('fast reading takes fewer minutes than slow', () => {
    const text = Array.from({ length: 500 }, () => 'word').join(' ');
    const slow = calculateReadingTimeMinutes(text, 'slow');
    const fast = calculateReadingTimeMinutes(text, 'fast');
    expect(fast).toBeLessThanOrEqual(slow);
  });

  it('returns rounded integer', () => {
    const text = Array.from({ length: 360 }, () => 'word').join(' '); // 360/180 = 2
    const result = calculateReadingTimeMinutes(text, 'slow');
    expect(Number.isInteger(result)).toBe(true);
    expect(result).toBe(2);
  });

  it('minimum 1 minute even for very short text', () => {
    expect(calculateReadingTimeMinutes('a b c')).toBe(1);
  });
});

// ─── calculateReadingTimeDetailed ─────────────────────────────────────────────

describe('calculateReadingTimeDetailed', () => {
  it('returns full object for empty text', () => {
    const result = calculateReadingTimeDetailed('');
    expect(result.wordCount).toBe(0);
    expect(result.estimatedMinutes).toBe(1);
    expect(result.exactMinutes).toBe(0);
    expect(result.formattedTime).toBe('~1 min');
    expect(result.speedUsed).toBeDefined();
  });

  it('returns correct wordCount', () => {
    const text = 'one two three four five';
    const result = calculateReadingTimeDetailed(text);
    expect(result.wordCount).toBe(5);
  });

  it('formattedTime uses "min" for < 60 minutes', () => {
    const text = Array.from({ length: 180 }, () => 'word').join(' ');
    const result = calculateReadingTimeDetailed(text, 'slow');
    expect(result.formattedTime).toMatch(/min/);
    expect(result.formattedTime).not.toMatch(/h/);
  });

  it('formattedTime uses "h" for >= 60 minutes', () => {
    // 180 wpm * 60 min = 10800 words for 1 hour
    const text = Array.from({ length: 10800 }, () => 'word').join(' ');
    const result = calculateReadingTimeDetailed(text, 'slow');
    expect(result.formattedTime).toContain('h');
  });

  it('estimatedMinutes minimum is 1', () => {
    const result = calculateReadingTimeDetailed('hello');
    expect(result.estimatedMinutes).toBeGreaterThanOrEqual(1);
  });

  it('exactMinutes has 2 decimal precision', () => {
    const text = Array.from({ length: 90 }, () => 'word').join(' '); // 90/180 = 0.5
    const result = calculateReadingTimeDetailed(text, 'slow');
    expect(result.exactMinutes).toBe(0.5);
  });

  it('speedUsed matches the passed speed', () => {
    const text = 'hello world';
    const resultFast = calculateReadingTimeDetailed(text, 'fast');
    expect(resultFast.speedUsed).toBe(READING_SPEEDS.fast);
  });

  it('formattedTime for exactly 2 hours has no minutes part', () => {
    // 180 wpm * 120 min = 21600 words = 2h exactly
    const text = Array.from({ length: 21600 }, () => 'word').join(' ');
    const result = calculateReadingTimeDetailed(text, 'slow');
    expect(result.formattedTime).toBe('~2h');
  });
});

// ─── getReadingTimeInfo ───────────────────────────────────────────────────────

describe('getReadingTimeInfo', () => {
  it('returns same result as calculateReadingTimeDetailed with slow speed', () => {
    const text = 'Hello world this is a test';
    const fromInfo = getReadingTimeInfo(text);
    const fromDetailed = calculateReadingTimeDetailed(text, 'slow');
    expect(fromInfo.wordCount).toBe(fromDetailed.wordCount);
    expect(fromInfo.estimatedMinutes).toBe(fromDetailed.estimatedMinutes);
    expect(fromInfo.formattedTime).toBe(fromDetailed.formattedTime);
  });
});
