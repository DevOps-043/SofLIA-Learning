import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CourseAnalysisService } from '../course-analysis.service'
import {
  fetchCourseLessonCountRows,
  fetchUserCourseProgressRows,
} from '../course-analysis/db'

vi.mock('../course-analysis/db', async () => {
  return {
    fetchActivePurchasedCourseIds: vi.fn(),
    fetchAvailableCourseRows: vi.fn(),
    fetchCompletedLessonIds: vi.fn(),
    fetchCourseLessonCountRows: vi.fn(),
    fetchCourseInfoRow: vi.fn(),
    fetchCourseModulesRows: vi.fn(),
    fetchLessonActivityRows: vi.fn(),
    fetchLessonEstimateRows: vi.fn(),
    fetchLessonMaterialRows: vi.fn(),
    fetchLessonRows: vi.fn(),
    fetchUserCourseProgressRow: vi.fn(),
    fetchUserCourseProgressRows: vi.fn(),
    fetchUserStudyStreakRow: vi.fn(),
  }
})

describe('CourseAnalysisService progress batching', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('builds progress summaries in bulk with deduplicated course ids', async () => {
    vi.mocked(fetchUserCourseProgressRows).mockResolvedValue([
      {
        course_id: 'course-1',
        progress_percentage: 75,
        completed_lessons_count: 3,
        last_accessed_at: '2026-04-01T10:00:00.000Z',
      },
      {
        course_id: 'course-2',
        progress_percentage: 20,
        completed_lessons_count: 1,
        last_accessed_at: null,
      },
    ])
    vi.mocked(fetchCourseLessonCountRows).mockResolvedValue([
      {
        course_id: 'course-1',
        course_lessons: [
          { lesson_id: 'lesson-1', is_published: true },
          { lesson_id: 'lesson-2', is_published: false },
        ],
      },
      {
        course_id: 'course-1',
        course_lessons: [{ lesson_id: 'lesson-3', is_published: true }],
      },
      {
        course_id: 'course-2',
        course_lessons: [{ lesson_id: 'lesson-4', is_published: true }],
      },
    ])

    const progressByCourseId = await CourseAnalysisService.getUserCourseProgressMap(
      'user-1',
      ['course-1', 'course-2', 'course-1'],
    )

    expect(fetchUserCourseProgressRows).toHaveBeenCalledWith('user-1', [
      'course-1',
      'course-2',
    ])
    expect(fetchCourseLessonCountRows).toHaveBeenCalledWith([
      'course-1',
      'course-2',
    ])
    expect(progressByCourseId.get('course-1')).toEqual({
      progressPercentage: 75,
      completedLessons: 3,
      totalLessons: 2,
      lastAccessedAt: '2026-04-01T10:00:00.000Z',
    })
    expect(progressByCourseId.get('course-2')).toEqual({
      progressPercentage: 20,
      completedLessons: 1,
      totalLessons: 1,
      lastAccessedAt: undefined,
    })
  })

  it('returns a zeroed summary when no enrollment exists for the course', async () => {
    vi.mocked(fetchUserCourseProgressRows).mockResolvedValue([])
    vi.mocked(fetchCourseLessonCountRows).mockResolvedValue([
      {
        course_id: 'course-3',
        course_lessons: [
          { lesson_id: 'lesson-1', is_published: true },
          { lesson_id: 'lesson-2', is_published: true },
        ],
      },
    ])

    await expect(
      CourseAnalysisService.getUserCourseProgress('user-1', 'course-3'),
    ).resolves.toEqual({
      progressPercentage: 0,
      completedLessons: 0,
      totalLessons: 2,
      lastAccessedAt: undefined,
    })
  })
})
