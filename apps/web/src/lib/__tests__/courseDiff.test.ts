import { describe, it, expect } from 'vitest';
import { buildCourseDiff } from '../courseDiff';

// ─── helpers ──────────────────────────────────────────────────────────────────

const makeLesson = (order: number, overrides: Record<string, any> = {}) => ({
  lesson_order_index: order,
  lesson_title: `Lesson ${order}`,
  video_provider_id: null,
  duration_seconds: 300,
  transcript_content: null,
  summary_content: null,
  ...overrides,
});

const makeModule = (order: number, lessons: any[] = [], overrides: Record<string, any> = {}) => ({
  module_order_index: order,
  module_title: `Module ${order}`,
  lessons,
  ...overrides,
});

const makeCourse = (modules: any[] = [], overrides: Record<string, any> = {}) => ({
  title: 'Test Course',
  description: 'A test course',
  level: 'beginner',
  category: 'tech',
  thumbnail_url: null,
  modules,
  ...overrides,
});

// ─── identical courses ────────────────────────────────────────────────────────

describe('buildCourseDiff — identical courses', () => {
  it('has no courseChanges when nothing changed', () => {
    const course = makeCourse([]);
    const diff = buildCourseDiff(course, course);
    expect(diff.courseChanges).toHaveLength(0);
  });

  it('has no module changes when modules are identical', () => {
    const lessons = [makeLesson(1), makeLesson(2)];
    const course = makeCourse([makeModule(1, lessons)]);
    const diff = buildCourseDiff(course, course);
    expect(diff.summary.modulesAdded).toBe(0);
    expect(diff.summary.modulesRemoved).toBe(0);
    expect(diff.summary.modulesModified).toBe(0);
  });

  it('marks unchanged lessons as "unchanged"', () => {
    const lesson = makeLesson(1);
    const course = makeCourse([makeModule(1, [lesson])]);
    const diff = buildCourseDiff(course, course);
    expect(diff.modules[0].lessons[0].status).toBe('unchanged');
  });
});

// ─── course-level changes ─────────────────────────────────────────────────────

describe('buildCourseDiff — course-level changes', () => {
  it('detects title change', () => {
    const original = makeCourse([], { title: 'Old Title' });
    const proposed = makeCourse([], { title: 'New Title' });
    const diff = buildCourseDiff(original, proposed);
    const titleChange = diff.courseChanges.find(c => c.field === 'title');
    expect(titleChange).toBeDefined();
    expect(titleChange!.oldValue).toBe('Old Title');
    expect(titleChange!.newValue).toBe('New Title');
  });

  it('detects description change', () => {
    const original = makeCourse([], { description: 'Old desc' });
    const proposed = makeCourse([], { description: 'New desc' });
    const diff = buildCourseDiff(original, proposed);
    const descChange = diff.courseChanges.find(c => c.field === 'description');
    expect(descChange).toBeDefined();
  });

  it('detects level change', () => {
    const original = makeCourse([], { level: 'beginner' });
    const proposed = makeCourse([], { level: 'advanced' });
    const diff = buildCourseDiff(original, proposed);
    const levelChange = diff.courseChanges.find(c => c.field === 'level');
    expect(levelChange).toBeDefined();
    expect(levelChange!.oldValue).toBe('beginner');
    expect(levelChange!.newValue).toBe('advanced');
  });

  it('ignores whitespace-only changes (normalizes to null)', () => {
    const original = makeCourse([], { description: '   ' });
    const proposed = makeCourse([], { description: null });
    const diff = buildCourseDiff(original, proposed);
    const descChange = diff.courseChanges.find(c => c.field === 'description');
    expect(descChange).toBeUndefined(); // both normalize to null
  });
});

// ─── module-level changes ─────────────────────────────────────────────────────

describe('buildCourseDiff — module changes', () => {
  it('marks new module as "added"', () => {
    const original = makeCourse([]);
    const proposed = makeCourse([makeModule(1, [makeLesson(1)])]);
    const diff = buildCourseDiff(original, proposed);
    expect(diff.summary.modulesAdded).toBe(1);
    expect(diff.modules[0].status).toBe('added');
  });

  it('marks removed module as "removed"', () => {
    const original = makeCourse([makeModule(1, [makeLesson(1)])]);
    const proposed = makeCourse([]);
    const diff = buildCourseDiff(original, proposed);
    expect(diff.summary.modulesRemoved).toBe(1);
    expect(diff.modules[0].status).toBe('removed');
  });

  it('marks lessons of added module as "added"', () => {
    const original = makeCourse([]);
    const proposed = makeCourse([makeModule(1, [makeLesson(1), makeLesson(2)])]);
    const diff = buildCourseDiff(original, proposed);
    expect(diff.summary.lessonsAdded).toBe(2);
    for (const lesson of diff.modules[0].lessons) {
      expect(lesson.status).toBe('added');
    }
  });

  it('marks lessons of removed module as "removed"', () => {
    const original = makeCourse([makeModule(1, [makeLesson(1), makeLesson(2)])]);
    const proposed = makeCourse([]);
    const diff = buildCourseDiff(original, proposed);
    expect(diff.summary.lessonsRemoved).toBe(2);
  });

  it('detects module title change as "modified"', () => {
    const original = makeCourse([makeModule(1, [], { module_title: 'Old Module' })]);
    const proposed = makeCourse([makeModule(1, [], { module_title: 'New Module' })]);
    const diff = buildCourseDiff(original, proposed);
    expect(diff.modules[0].status).toBe('modified');
    expect(diff.summary.modulesModified).toBe(1);
  });

  it('orders modules by module_order_index', () => {
    const original = makeCourse([makeModule(2), makeModule(1)]);
    const proposed = makeCourse([makeModule(2), makeModule(1)]);
    const diff = buildCourseDiff(original, proposed);
    expect(diff.modules[0].module_title).toBe('Module 1');
    expect(diff.modules[1].module_title).toBe('Module 2');
  });
});

// ─── lesson-level changes ─────────────────────────────────────────────────────

describe('buildCourseDiff — lesson changes', () => {
  it('detects lesson title change as "modified"', () => {
    const origLesson = makeLesson(1, { lesson_title: 'Old Lesson' });
    const propLesson = makeLesson(1, { lesson_title: 'New Lesson' });
    const original = makeCourse([makeModule(1, [origLesson])]);
    const proposed = makeCourse([makeModule(1, [propLesson])]);
    const diff = buildCourseDiff(original, proposed);
    expect(diff.modules[0].lessons[0].status).toBe('modified');
    expect(diff.summary.lessonsModified).toBe(1);
  });

  it('detects duration_seconds change', () => {
    const origLesson = makeLesson(1, { duration_seconds: 300 });
    const propLesson = makeLesson(1, { duration_seconds: 600 });
    const original = makeCourse([makeModule(1, [origLesson])]);
    const proposed = makeCourse([makeModule(1, [propLesson])]);
    const diff = buildCourseDiff(original, proposed);
    const lessonChange = diff.modules[0].lessons[0].changes.find(c => c.field === 'duration_seconds');
    expect(lessonChange).toBeDefined();
    expect(lessonChange!.oldValue).toBe(300);
    expect(lessonChange!.newValue).toBe(600);
  });

  it('marks new lesson as "added"', () => {
    const original = makeCourse([makeModule(1, [makeLesson(1)])]);
    const proposed = makeCourse([makeModule(1, [makeLesson(1), makeLesson(2)])]);
    const diff = buildCourseDiff(original, proposed);
    const added = diff.modules[0].lessons.find(l => l.lesson_title === 'Lesson 2');
    expect(added?.status).toBe('added');
    expect(diff.summary.lessonsAdded).toBe(1);
  });

  it('marks removed lesson as "removed"', () => {
    const original = makeCourse([makeModule(1, [makeLesson(1), makeLesson(2)])]);
    const proposed = makeCourse([makeModule(1, [makeLesson(1)])]);
    const diff = buildCourseDiff(original, proposed);
    const removed = diff.modules[0].lessons.find(l => l.lesson_title === 'Lesson 2');
    expect(removed?.status).toBe('removed');
    expect(diff.summary.lessonsRemoved).toBe(1);
  });

  it('includes original_title when lesson is renamed', () => {
    const origLesson = makeLesson(1, { lesson_title: 'Original Name' });
    const propLesson = makeLesson(1, { lesson_title: 'New Name' });
    const original = makeCourse([makeModule(1, [origLesson])]);
    const proposed = makeCourse([makeModule(1, [propLesson])]);
    const diff = buildCourseDiff(original, proposed);
    const lesson = diff.modules[0].lessons[0];
    expect(lesson.original_title).toBe('Original Name');
  });
});

// ─── empty courses ────────────────────────────────────────────────────────────

describe('buildCourseDiff — empty courses', () => {
  it('handles both courses with no modules', () => {
    const diff = buildCourseDiff(makeCourse([]), makeCourse([]));
    expect(diff.modules).toHaveLength(0);
    expect(diff.summary.modulesAdded).toBe(0);
    expect(diff.summary.modulesRemoved).toBe(0);
  });

  it('handles undefined modules (defaults to [])', () => {
    const original = makeCourse();
    const proposed = makeCourse();
    delete (original as any).modules;
    delete (proposed as any).modules;
    const diff = buildCourseDiff(original, proposed);
    expect(diff.modules).toHaveLength(0);
  });

  it('summary has all zero counts for identical empty courses', () => {
    const diff = buildCourseDiff(makeCourse([]), makeCourse([]));
    expect(diff.summary).toEqual({
      modulesAdded: 0,
      modulesRemoved: 0,
      modulesModified: 0,
      lessonsAdded: 0,
      lessonsRemoved: 0,
      lessonsModified: 0,
    });
  });
});
