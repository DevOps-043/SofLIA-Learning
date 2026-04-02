import { describe, it, expect } from 'vitest';
import {
  extractModuleNumber,
  sortModules,
  sortLessons,
  getModuleProgress,
  formatLessonDuration,
  getQuizStatusItem,
} from '../utils';
import type { LearnLesson, LearnModule, LessonQuizStatus } from '../../types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeModule(title: string, orderIndex = 0): LearnModule {
  return {
    module_id: `mod-${title}`,
    module_title: title,
    module_order_index: orderIndex,
    lessons: [],
    is_completed: false,
  } as unknown as LearnModule;
}

function makeLesson(orderIndex: number, isCompleted = false): LearnLesson {
  return {
    lesson_id: `lesson-${orderIndex}`,
    lesson_title: `Lesson ${orderIndex}`,
    lesson_order_index: orderIndex,
    is_completed: isCompleted,
  } as unknown as LearnLesson;
}

// ─── extractModuleNumber ──────────────────────────────────────────────────────

describe('extractModuleNumber', () => {
  it('extracts number from "Módulo 1"', () => {
    expect(extractModuleNumber('Módulo 1')).toBe(1);
  });

  it('extracts number from "modulo 3"', () => {
    expect(extractModuleNumber('modulo 3')).toBe(3);
  });

  it('is case-insensitive', () => {
    expect(extractModuleNumber('MÓDULO 5')).toBe(5);
    expect(extractModuleNumber('Modulo 2')).toBe(2);
  });

  it('handles "módulo" with accent', () => {
    expect(extractModuleNumber('Módulo 10')).toBe(10);
  });

  it('returns 999 (fallback) when title has no module number', () => {
    expect(extractModuleNumber('Introduction')).toBe(999);
    expect(extractModuleNumber('')).toBe(999);
  });

  it('extracts number when preceded by extra text', () => {
    expect(extractModuleNumber('Curso: Módulo 4 - Advanced')).toBe(4);
  });
});

// ─── sortModules ──────────────────────────────────────────────────────────────

describe('sortModules', () => {
  it('sorts modules by their number in title', () => {
    const modules = [
      makeModule('Módulo 3', 3),
      makeModule('Módulo 1', 1),
      makeModule('Módulo 2', 2),
    ];
    const sorted = sortModules(modules);
    expect(sorted[0].module_title).toBe('Módulo 1');
    expect(sorted[1].module_title).toBe('Módulo 2');
    expect(sorted[2].module_title).toBe('Módulo 3');
  });

  it('puts numbered modules before unnamed modules', () => {
    const modules = [
      makeModule('Introduction', 1),
      makeModule('Módulo 1', 2),
    ];
    const sorted = sortModules(modules);
    expect(sorted[0].module_title).toBe('Módulo 1');
    expect(sorted[1].module_title).toBe('Introduction');
  });

  it('falls back to module_order_index when both lack numbers', () => {
    const modules = [
      makeModule('Intro', 5),
      makeModule('Overview', 2),
    ];
    const sorted = sortModules(modules);
    expect(sorted[0].module_title).toBe('Overview');
    expect(sorted[1].module_title).toBe('Intro');
  });

  it('does not mutate original array', () => {
    const modules = [makeModule('Módulo 2'), makeModule('Módulo 1')];
    const original = [...modules];
    sortModules(modules);
    expect(modules[0].module_title).toBe(original[0].module_title);
  });

  it('handles empty array', () => {
    expect(sortModules([])).toEqual([]);
  });
});

// ─── sortLessons ──────────────────────────────────────────────────────────────

describe('sortLessons', () => {
  it('sorts lessons by lesson_order_index ascending', () => {
    const lessons = [makeLesson(3), makeLesson(1), makeLesson(2)];
    const sorted = sortLessons(lessons);
    expect(sorted[0].lesson_order_index).toBe(1);
    expect(sorted[1].lesson_order_index).toBe(2);
    expect(sorted[2].lesson_order_index).toBe(3);
  });

  it('treats undefined order_index as 0', () => {
    const lessons = [
      makeLesson(5),
      { lesson_id: 'no-order', lesson_title: 'No Order', is_completed: false } as unknown as LearnLesson,
    ];
    const sorted = sortLessons(lessons);
    expect(sorted[0].lesson_id).toBe('no-order');
  });

  it('does not mutate original array', () => {
    const lessons = [makeLesson(2), makeLesson(1)];
    const original = [...lessons];
    sortLessons(lessons);
    expect(lessons[0].lesson_order_index).toBe(original[0].lesson_order_index);
  });

  it('handles empty array', () => {
    expect(sortLessons([])).toEqual([]);
  });
});

// ─── getModuleProgress ────────────────────────────────────────────────────────

describe('getModuleProgress', () => {
  it('returns 0 progress for empty lessons', () => {
    const result = getModuleProgress([]);
    expect(result.completionPercentage).toBe(0);
    expect(result.completedLessons).toBe(0);
    expect(result.totalLessons).toBe(0);
  });

  it('returns 100% when all lessons completed', () => {
    const lessons = [makeLesson(1, true), makeLesson(2, true)];
    const result = getModuleProgress(lessons);
    expect(result.completionPercentage).toBe(100);
    expect(result.completedLessons).toBe(2);
    expect(result.totalLessons).toBe(2);
  });

  it('returns 50% when half lessons completed', () => {
    const lessons = [makeLesson(1, true), makeLesson(2, false)];
    const result = getModuleProgress(lessons);
    expect(result.completionPercentage).toBe(50);
    expect(result.completedLessons).toBe(1);
  });

  it('returns 0% when no lessons completed', () => {
    const lessons = [makeLesson(1, false), makeLesson(2, false)];
    const result = getModuleProgress(lessons);
    expect(result.completionPercentage).toBe(0);
    expect(result.completedLessons).toBe(0);
  });

  it('rounds percentage to nearest integer', () => {
    // 1 of 3 = 33.33...% → rounds to 33
    const lessons = [makeLesson(1, true), makeLesson(2, false), makeLesson(3, false)];
    const result = getModuleProgress(lessons);
    expect(result.completionPercentage).toBe(33);
  });
});

// ─── formatLessonDuration ─────────────────────────────────────────────────────

describe('formatLessonDuration', () => {
  it('formats 0 seconds as "0:00"', () => {
    expect(formatLessonDuration(0)).toBe('0:00');
  });

  it('formats undefined as "0:00"', () => {
    expect(formatLessonDuration(undefined)).toBe('0:00');
  });

  it('formats 60 seconds as "1:00"', () => {
    expect(formatLessonDuration(60)).toBe('1:00');
  });

  it('formats 65 seconds as "1:05"', () => {
    expect(formatLessonDuration(65)).toBe('1:05');
  });

  it('pads seconds with leading zero', () => {
    expect(formatLessonDuration(305)).toBe('5:05');
  });

  it('formats 3600 seconds as "60:00"', () => {
    expect(formatLessonDuration(3600)).toBe('60:00');
  });

  it('handles negative durations as "0:00"', () => {
    expect(formatLessonDuration(-1)).toBe('0:00');
  });
});

// ─── getQuizStatusItem ────────────────────────────────────────────────────────

describe('getQuizStatusItem', () => {
  const makeQuizStatus = (quizzes: Array<{ id: string; type: 'activity' | 'material'; passed: boolean }>): LessonQuizStatus => ({
    quizzes,
  } as unknown as LessonQuizStatus);

  it('returns null for null quizStatus', () => {
    expect(getQuizStatusItem(null, 'q1', 'activity')).toBeNull();
  });

  it('returns null for undefined quizStatus', () => {
    expect(getQuizStatusItem(undefined, 'q1', 'activity')).toBeNull();
  });

  it('returns null for empty quizzes array', () => {
    const status = makeQuizStatus([]);
    expect(getQuizStatusItem(status, 'q1', 'activity')).toBeNull();
  });

  it('returns matching quiz item by id and type', () => {
    const status = makeQuizStatus([
      { id: 'q1', type: 'activity', passed: true },
      { id: 'q2', type: 'material', passed: false },
    ]);
    const result = getQuizStatusItem(status, 'q1', 'activity');
    expect(result).not.toBeNull();
    expect((result as any).id).toBe('q1');
  });

  it('returns null when id matches but type does not', () => {
    const status = makeQuizStatus([{ id: 'q1', type: 'activity', passed: true }]);
    expect(getQuizStatusItem(status, 'q1', 'material')).toBeNull();
  });

  it('returns null when type matches but id does not', () => {
    const status = makeQuizStatus([{ id: 'q1', type: 'activity', passed: true }]);
    expect(getQuizStatusItem(status, 'q99', 'activity')).toBeNull();
  });
});
