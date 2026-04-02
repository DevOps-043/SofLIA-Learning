import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildStudyPlannerUserContext,
  enrichUserCourses,
} from '../study-planner-user-context.server.service'
import { CourseAnalysisService } from '../course-analysis.service'
import { UserContextService } from '../user-context.service'

vi.mock('../course-analysis.service', () => ({
  CourseAnalysisService: {
    getUserCourseProgressMap: vi.fn(),
  },
}))

vi.mock('../user-context.service', () => ({
  UserContextService: {
    getFullUserContext: vi.fn(),
  },
}))

describe('study-planner-user-context.server.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('enriches only the courses that have progress data', () => {
    const result = enrichUserCourses({
      courses: [
        {
          courseId: 'course-1',
          course: {
            id: 'course-1',
            title: 'Curso 1',
            slug: 'curso-1',
            category: 'Ventas',
            level: 'beginner',
            durationTotalMinutes: 60,
            isActive: true,
          },
          userType: 'b2b',
          status: 'assigned',
          completionPercentage: 0,
          source: 'organization',
        },
        {
          courseId: 'course-2',
          course: {
            id: 'course-2',
            title: 'Curso 2',
            slug: 'curso-2',
            category: 'Ventas',
            level: 'beginner',
            durationTotalMinutes: 60,
            isActive: true,
          },
          userType: 'b2b',
          status: 'assigned',
          completionPercentage: 15,
          source: 'organization',
        },
      ],
      progressByCourseId: new Map([
        [
          'course-1',
          {
            progressPercentage: 80,
            completedLessons: 8,
            totalLessons: 10,
            lastAccessedAt: '2026-04-01T08:30:00.000Z',
          },
        ],
      ]),
    })

    expect(result[0]).toMatchObject({
      completionPercentage: 80,
      completedLessons: 8,
      totalLessons: 10,
      lastAccessedAt: '2026-04-01T08:30:00.000Z',
    })
    expect(result[1]).toMatchObject({
      completionPercentage: 15,
    })
    expect(result[1].completedLessons).toBeUndefined()
  })

  it('builds the planner user context with one bulk progress lookup', async () => {
    vi.mocked(UserContextService.getFullUserContext).mockResolvedValue({
      user: {
        id: 'user-1',
        username: 'ana',
      },
      userType: 'b2b',
      courses: [
        {
          courseId: 'course-1',
          course: {
            id: 'course-1',
            title: 'Curso 1',
            slug: 'curso-1',
            category: 'Ventas',
            level: 'beginner',
            durationTotalMinutes: 60,
            isActive: true,
          },
          userType: 'b2b',
          status: 'assigned',
          completionPercentage: 0,
          source: 'organization',
        },
        {
          courseId: 'course-2',
          course: {
            id: 'course-2',
            title: 'Curso 2',
            slug: 'curso-2',
            category: 'Ventas',
            level: 'beginner',
            durationTotalMinutes: 75,
            isActive: true,
          },
          userType: 'b2b',
          status: 'assigned',
          completionPercentage: 5,
          source: 'team',
        },
      ],
    })
    vi.mocked(CourseAnalysisService.getUserCourseProgressMap).mockResolvedValue(
      new Map([
        [
          'course-1',
          {
            progressPercentage: 90,
            completedLessons: 9,
            totalLessons: 10,
            lastAccessedAt: '2026-04-01T09:00:00.000Z',
          },
        ],
      ]),
    )

    const result = await buildStudyPlannerUserContext('user-1')

    expect(UserContextService.getFullUserContext).toHaveBeenCalledWith('user-1')
    expect(CourseAnalysisService.getUserCourseProgressMap).toHaveBeenCalledWith(
      'user-1',
      ['course-1', 'course-2'],
    )
    expect(result.userId).toBe('user-1')
    expect(result.courses[0]).toMatchObject({
      completionPercentage: 90,
      completedLessons: 9,
      totalLessons: 10,
    })
    expect(result.courses[1]).toMatchObject({
      completionPercentage: 5,
    })
  })
})
