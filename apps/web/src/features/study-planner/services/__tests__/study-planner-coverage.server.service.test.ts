import { describe, expect, it } from 'vitest';
import {
  computeStudyPlannerCourseCoverage,
  extractPlannedLessonIdsFromSession,
} from '../study-planner-coverage.shared';

describe('study-planner-coverage.server.service', () => {
  it('keeps course totals deterministic for a 14 lesson course', () => {
    const lessons = Array.from({ length: 14 }, (_, index) => ({
      lessonId: `lesson-${index + 1}`,
      lessonOrderIndex: index + 1,
      lessonTitle: `Lesson ${index + 1}`,
      moduleId: 'module-1',
      moduleOrderIndex: 1,
      moduleTitle: 'Module 1',
    }));

    const plannedSessionIdsByLessonId = new Map<string, Set<string>>(
      lessons.map((lesson, index) => [
        lesson.lessonId,
        index < 12 ? new Set([`session-${index + 1}`]) : new Set(),
      ]),
    );

    const result = computeStudyPlannerCourseCoverage({
      completedLessonIds: new Set(['lesson-1', 'lesson-2']),
      courseId: 'course-1',
      courseTitle: 'Curso 14',
      lessons,
      plannedSessionIdsByLessonId,
    });

    expect(result.totalLessons).toBe(14);
    expect(result.completedLessons).toBe(2);
    expect(result.pendingLessons).toBe(12);
    expect(result.plannedLessons).toBe(12);
    expect(result.unplannedLessons).toBe(2);
    expect(result.coverageStatus).toBe('partial');
  });

  it('deduplicates planned lesson ids from metrics and direct lesson references', () => {
    const result = extractPlannedLessonIdsFromSession({
      course_id: 'course-1',
      lesson_id: 'lesson-1',
      metrics: {
        plannedLessonIds: ['lesson-1', 'lesson-2'],
        plannedLessons: [
          { courseId: 'course-1', lessonId: 'lesson-2' },
          { courseId: 'course-1', lessonId: 'lesson-3' },
          { courseId: 'course-2', lessonId: 'lesson-99' },
        ],
      },
    });

    expect(result).toEqual(['lesson-1', 'lesson-2', 'lesson-3']);
  });
});
