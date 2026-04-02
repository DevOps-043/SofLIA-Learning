import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CourseAnalysisService } from '../course-analysis.service'
import {
  fetchCourseInfoRow,
  fetchCourseModulesRows,
  fetchCourseModulesRowsByCourseIds,
} from '../course-analysis/db'
import { fetchLessonDurationMap } from '../course-analysis/duration.service'

vi.mock('../course-analysis/db', async () => {
  return {
    fetchActivePurchasedCourseIds: vi.fn(),
    fetchAvailableCourseRows: vi.fn(),
    fetchCompletedLessonIds: vi.fn(),
    fetchCourseInfoRow: vi.fn(),
    fetchCourseLessonCountRows: vi.fn(),
    fetchCourseModulesRows: vi.fn(),
    fetchCourseModulesRowsByCourseIds: vi.fn(),
    fetchLessonActivityRows: vi.fn(),
    fetchLessonEstimateRows: vi.fn(),
    fetchLessonMaterialRows: vi.fn(),
    fetchLessonRows: vi.fn(),
    fetchUserCourseProgressRows: vi.fn(),
    fetchUserStudyStreakRow: vi.fn(),
  }
})

vi.mock('../course-analysis/duration.service', async () => {
  return {
    fetchCourseLessonDurations: vi.fn(),
    fetchLessonDurationMap: vi.fn(),
  }
})

describe('CourseAnalysisService batching', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads lesson durations for multiple courses with a single bulk query', async () => {
    vi.mocked(fetchCourseModulesRowsByCourseIds).mockResolvedValue([
      {
        course_id: 'course-1',
        module_id: 'module-1',
        module_title: 'Modulo 1',
        module_description: null,
        module_order_index: 1,
        module_duration_minutes: 20,
        is_required: true,
        is_published: true,
        course_lessons: [
          {
            lesson_id: 'lesson-1',
            lesson_title: 'Leccion 1',
            lesson_description: null,
            lesson_order_index: 1,
            duration_seconds: 600,
            is_published: true,
          },
        ],
      },
      {
        course_id: 'course-2',
        module_id: 'module-2',
        module_title: 'Modulo 2',
        module_description: null,
        module_order_index: 1,
        module_duration_minutes: 30,
        is_required: true,
        is_published: true,
        course_lessons: [
          {
            lesson_id: 'lesson-2',
            lesson_title: 'Leccion 2',
            lesson_description: null,
            lesson_order_index: 1,
            duration_seconds: 1200,
            is_published: true,
          },
        ],
      },
    ])
    vi.mocked(fetchLessonDurationMap).mockResolvedValue(
      new Map([
        [
          'lesson-1',
          {
            lessonId: 'lesson-1',
            lessonTitle: 'Leccion 1',
            videoMinutes: 10,
            activitiesMinutes: 5,
            materialsMinutes: 0,
            interactionsMinutes: 3,
            totalMinutes: 18,
            isEstimated: false,
          },
        ],
        [
          'lesson-2',
          {
            lessonId: 'lesson-2',
            lessonTitle: 'Leccion 2',
            videoMinutes: 20,
            activitiesMinutes: 10,
            materialsMinutes: 0,
            interactionsMinutes: 3,
            totalMinutes: 33,
            isEstimated: false,
          },
        ],
      ]),
    )

    const durationsByCourse = await CourseAnalysisService.getAllLessonsForCourses([
      'course-1',
      'course-2',
      'course-1',
    ])

    expect(fetchCourseModulesRowsByCourseIds).toHaveBeenCalledWith([
      'course-1',
      'course-2',
    ])
    expect(fetchLessonDurationMap).toHaveBeenCalledWith(['lesson-1', 'lesson-2'])
    expect(fetchCourseModulesRows).not.toHaveBeenCalled()
    expect(durationsByCourse.get('course-1')).toEqual([
      expect.objectContaining({ lessonId: 'lesson-1', totalMinutes: 18 }),
    ])
    expect(durationsByCourse.get('course-2')).toEqual([
      expect.objectContaining({ lessonId: 'lesson-2', totalMinutes: 33 }),
    ])
  })

  it('builds learning route suggestion data without re-fetching course info per course', async () => {
    vi.mocked(fetchCourseModulesRowsByCourseIds).mockResolvedValue([
      {
        course_id: 'course-1',
        module_id: 'module-1',
        module_title: 'Modulo 1',
        module_description: null,
        module_order_index: 1,
        module_duration_minutes: 20,
        is_required: true,
        is_published: true,
        course_lessons: [
          {
            lesson_id: 'lesson-1',
            lesson_title: 'Leccion 1',
            lesson_description: null,
            lesson_order_index: 1,
            duration_seconds: 600,
            is_published: true,
          },
          {
            lesson_id: 'lesson-2',
            lesson_title: 'Leccion 2',
            lesson_description: null,
            lesson_order_index: 2,
            duration_seconds: 900,
            is_published: true,
          },
        ],
      },
    ])
    vi.mocked(fetchLessonDurationMap).mockResolvedValue(
      new Map([
        [
          'lesson-1',
          {
            lessonId: 'lesson-1',
            lessonTitle: 'Leccion 1',
            videoMinutes: 10,
            activitiesMinutes: 5,
            materialsMinutes: 0,
            interactionsMinutes: 3,
            totalMinutes: 18,
            isEstimated: false,
          },
        ],
        [
          'lesson-2',
          {
            lessonId: 'lesson-2',
            lessonTitle: 'Leccion 2',
            videoMinutes: 15,
            activitiesMinutes: 5,
            materialsMinutes: 0,
            interactionsMinutes: 3,
            totalMinutes: 23,
            isEstimated: false,
          },
        ],
      ]),
    )

    const result = await CourseAnalysisService.prepareLearningRouteSuggestionData(
      'user-1',
      [
        {
          id: 'course-1',
          title: 'Curso A',
          slug: 'curso-a',
          category: 'leadership',
          level: 'intermediate',
          durationTotalMinutes: 45,
          isActive: true,
        },
      ],
      {
        rol: 'manager',
      },
    )

    expect(fetchCourseModulesRowsByCourseIds).toHaveBeenCalledWith(['course-1'])
    expect(fetchCourseInfoRow).not.toHaveBeenCalled()
    expect(result.complexities).toHaveLength(1)
    expect(result.complexities[0]).toMatchObject({
      courseId: 'course-1',
      totalLessons: 2,
      totalModules: 1,
      totalDurationMinutes: 41,
    })
  })
})
