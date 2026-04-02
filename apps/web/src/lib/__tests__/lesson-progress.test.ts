import { describe, it, expect } from 'vitest';
import {
  calculateCombinedLessonProgress,
  calculateCourseProgress,
} from '../utils/lesson-progress';

// ─── calculateCombinedLessonProgress ────────────────────────────────────────

describe('calculateCombinedLessonProgress', () => {
  // No quizzes → return videoProgress as-is
  it('returns videoProgress when no quizzes (default)', () => {
    expect(calculateCombinedLessonProgress(75, false)).toBe(75);
    expect(calculateCombinedLessonProgress(100, true)).toBe(100);
  });

  it('returns videoProgress when hasQuizzes is false', () => {
    expect(calculateCombinedLessonProgress(50, true, false)).toBe(50);
  });

  it('returns videoProgress when quiz not passed and hasQuizzes is true', () => {
    expect(calculateCombinedLessonProgress(80, false, true)).toBe(80);
  });

  it('applies 50/50 formula when quiz passed: (video * 0.5) + 50', () => {
    // 100% video + quiz passed = 100% total
    expect(calculateCombinedLessonProgress(100, true, true)).toBe(100);
  });

  it('applies 50/50 formula for partial video + quiz passed', () => {
    // 60% video + quiz passed = (60 * 0.5) + 50 = 80
    expect(calculateCombinedLessonProgress(60, true, true)).toBe(80);
  });

  it('applies 50/50 formula for 0% video + quiz passed', () => {
    // 0% video + quiz passed = (0 * 0.5) + 50 = 50
    expect(calculateCombinedLessonProgress(0, true, true)).toBe(50);
  });

  it('caps at 100 when result would exceed 100', () => {
    // Technically (100 * 0.5) + 50 = 100, but just in case of float edge cases
    const result = calculateCombinedLessonProgress(100, true, true);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('returns 0 when video is 0 and quiz not passed', () => {
    expect(calculateCombinedLessonProgress(0, false, true)).toBe(0);
  });

  it('returns 0 when video is 0 and no quizzes', () => {
    expect(calculateCombinedLessonProgress(0, false, false)).toBe(0);
  });
});

// ─── calculateCourseProgress ─────────────────────────────────────────────────

describe('calculateCourseProgress', () => {
  it('returns 0 for empty lessons array', () => {
    expect(calculateCourseProgress([])).toBe(0);
  });

  it('returns average video progress when no lessons have quizzes', () => {
    const lessons = [
      { lesson_id: 'l1', video_progress_percentage: 100, quiz_passed: false },
      { lesson_id: 'l2', video_progress_percentage: 50, quiz_passed: false },
    ];
    // (100 + 50) / 2 = 75
    expect(calculateCourseProgress(lessons)).toBe(75);
  });

  it('uses quiz formula when lesson has quizzes (Set)', () => {
    const lessons = [
      { lesson_id: 'l1', video_progress_percentage: 100, quiz_passed: true },
    ];
    const quizLessons = new Set(['l1']);
    // (100 * 0.5) + 50 = 100
    expect(calculateCourseProgress(lessons, quizLessons)).toBe(100);
  });

  it('uses quiz formula when lesson has quizzes (Map)', () => {
    const lessons = [
      { lesson_id: 'l1', video_progress_percentage: 60, quiz_passed: true },
    ];
    const quizMap = new Map([['l1', true]]);
    // (60 * 0.5) + 50 = 80
    expect(calculateCourseProgress(lessons, quizMap)).toBe(80);
  });

  it('does not apply quiz formula to lessons NOT in quizLessons set', () => {
    const lessons = [
      { lesson_id: 'l1', video_progress_percentage: 80, quiz_passed: true },
      { lesson_id: 'l2', video_progress_percentage: 40, quiz_passed: false },
    ];
    const quizLessons = new Set(['l2']); // only l2 has quizzes
    // l1: 80 (no quiz applied since l1 not in set)
    // l2: 40 (quiz not passed, so video only)
    // avg = (80 + 40) / 2 = 60
    expect(calculateCourseProgress(lessons, quizLessons)).toBe(60);
  });

  it('returns rounded result to 2 decimal places', () => {
    const lessons = [
      { lesson_id: 'l1', video_progress_percentage: 33, quiz_passed: false },
      { lesson_id: 'l2', video_progress_percentage: 33, quiz_passed: false },
      { lesson_id: 'l3', video_progress_percentage: 34, quiz_passed: false },
    ];
    // (33 + 33 + 34) / 3 = 100 / 3 = 33.33
    const result = calculateCourseProgress(lessons);
    expect(result).toBe(33.33);
  });

  it('treats missing video_progress_percentage as 0', () => {
    const lessons = [
      { lesson_id: 'l1', video_progress_percentage: undefined as any, quiz_passed: false },
    ];
    expect(calculateCourseProgress(lessons)).toBe(0);
  });

  it('handles 100% progress for all lessons', () => {
    const lessons = [
      { lesson_id: 'l1', video_progress_percentage: 100, quiz_passed: false },
      { lesson_id: 'l2', video_progress_percentage: 100, quiz_passed: false },
    ];
    expect(calculateCourseProgress(lessons)).toBe(100);
  });

  it('handles single lesson at 50% progress', () => {
    const lessons = [
      { lesson_id: 'l1', video_progress_percentage: 50, quiz_passed: false },
    ];
    expect(calculateCourseProgress(lessons)).toBe(50);
  });
});
