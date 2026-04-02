import { describe, expect, it, vi } from 'vitest';
import { resolveStudyPlannerPendingLessonsForRecommendations } from '../planner-pending-lessons.service';

describe('planner-pending-lessons.service', () => {
  it('returns cached pending lessons without hitting the network', async () => {
    const fetchMock = vi.fn();
    const cachedPendingLessons = [
      {
        courseId: 'course-2',
        courseTitle: 'Curso dos',
        durationMinutes: 20,
        lessonId: 'lesson-2',
        lessonOrderIndex: 2,
        lessonTitle: 'Leccion 2',
        moduleOrderIndex: 0,
        moduleTitle: 'Modulo 1',
      },
      {
        courseId: 'course-1',
        courseTitle: 'Curso uno',
        durationMinutes: 15,
        lessonId: 'lesson-1',
        lessonOrderIndex: 1,
        lessonTitle: 'Leccion 1',
        moduleOrderIndex: 0,
        moduleTitle: 'Modulo 1',
      },
    ];

    const result = await resolveStudyPlannerPendingLessonsForRecommendations({
      availableCourses: [],
      cachedPendingLessons,
      fetchImpl: fetchMock as unknown as typeof fetch,
      selectedCourseIds: ['course-1', 'course-2'],
      userId: 'user-1',
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.map((lesson) => lesson.lessonId)).toEqual(['lesson-1', 'lesson-2']);
  });

  it('fetches only selected courses present in my-courses and excludes completed lessons', async () => {
    const fetchMock = vi.fn(async (input: string) => {
      if (input === '/api/my-courses') {
        return {
          ok: true,
          json: async () => ({
            courses: [{ course_id: 'course-1' }],
          }),
        };
      }

      if (input === '/api/workshops/course-1/metadata') {
        return {
          ok: true,
          json: async () => ({
            metadata: {
              modules: [
                {
                  moduleTitle: 'Modulo 1',
                  moduleOrderIndex: 0,
                  lessons: [
                    {
                      lessonId: 'lesson-1',
                      lessonOrderIndex: 1,
                      lessonTitle: 'Leccion 1',
                      totalDurationMinutes: 25,
                    },
                    {
                      lessonId: 'lesson-2',
                      lessonOrderIndex: 2,
                      lessonTitle: 'Leccion 2',
                      totalDurationMinutes: 30,
                    },
                  ],
                },
              ],
            },
          }),
        };
      }

      if (input === '/api/study-planner/course-progress?courseId=course-1') {
        return {
          ok: true,
          json: async () => ({
            completedLessonIds: ['lesson-1'],
          }),
        };
      }

      throw new Error(`Unexpected fetch: ${input}`);
    });

    const result = await resolveStudyPlannerPendingLessonsForRecommendations({
      availableCourses: [{ id: 'course-1', title: 'Curso uno', category: 'A', progress: 10 }],
      cachedPendingLessons: [],
      fetchImpl: fetchMock as unknown as typeof fetch,
      selectedCourseIds: ['course-1', 'course-2'],
      userId: 'user-1',
    });

    expect(result).toEqual([
      {
        courseId: 'course-1',
        courseTitle: 'Curso uno',
        durationMinutes: 30,
        lessonId: 'lesson-2',
        lessonOrderIndex: 2,
        lessonTitle: 'Leccion 2',
        moduleOrderIndex: 0,
        moduleTitle: 'Modulo 1',
      },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).not.toHaveBeenCalledWith('/api/workshops/course-2/metadata');
  });
});
