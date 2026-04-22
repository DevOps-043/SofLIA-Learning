import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildStudyPlannerUserContext,
  enrichUserCourses,
} from '../study-planner-user-context.server.service'
import { loadBusinessUserLearningPaths } from '@/features/learning-paths/services/learning-path-dashboard.server'
import { CourseAnalysisService } from '../course-analysis.service'
import { createClient } from '@/lib/supabase/server'
import {
  buildPlannedCourseKey,
  getUserPlannedCourseKeys,
} from '../study-planner-plans.server.service'
import { loadActiveOrganizationMemberships } from '../user-course-assignments/organization-memberships.service'
import { UserContextService } from '../user-context.service'

vi.mock('../course-analysis.service', () => ({
  CourseAnalysisService: {
    getUserCourseProgressMap: vi.fn(),
  },
}))

vi.mock('@/features/learning-paths/services/learning-path-dashboard.server', () => ({
  loadBusinessUserLearningPaths: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('../study-planner-plans.server.service', () => ({
  buildPlannedCourseKey: vi.fn((courseId: string, organizationId?: string | null) =>
    organizationId ? `${courseId}::${organizationId}` : courseId
  ),
  getUserPlannedCourseKeys: vi.fn(),
}))

vi.mock('../user-course-assignments/organization-memberships.service', () => ({
  loadActiveOrganizationMemberships: vi.fn(),
}))

vi.mock('../user-context.service', () => ({
  UserContextService: {
    getFullUserContext: vi.fn(),
  },
}))

describe('study-planner-user-context.server.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(loadBusinessUserLearningPaths).mockResolvedValue([])
    vi.mocked(loadActiveOrganizationMemberships).mockResolvedValue([])
    vi.mocked(getUserPlannedCourseKeys).mockResolvedValue(new Set())
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            returns: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
      })),
    } as never)
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

  it('adds unlocked learning path courses that are missing from direct assignments', async () => {
    vi.mocked(UserContextService.getFullUserContext).mockResolvedValue({
      user: {
        id: 'user-1',
        username: 'ana',
      },
      userType: 'b2b',
      organization: {
        id: 'org-1',
        name: 'Board Vision',
      },
      courses: [],
    })
    vi.mocked(loadActiveOrganizationMemberships).mockResolvedValue([
      {
        organizationId: 'org-1',
        organizationName: 'Board Vision',
        teamId: null,
        zoneId: null,
        regionId: null,
      },
    ])
    vi.mocked(loadBusinessUserLearningPaths).mockResolvedValue([
      {
        id: 'lp-1',
        title: 'Ruta 1',
        description: null,
        progressPercentage: 0,
        completedItemsCount: 0,
        totalItemsCount: 1,
        nextCourseSlug: 'trampa-insolvencia',
        items: [
          {
            courseId: 'course-lp-1',
            title: 'La Trampa de la Insolvencia',
            slug: 'trampa-insolvencia',
            thumbnail: null,
            position: 1,
            progress: 0,
            status: 'available',
            isUnlocked: true,
            isCompleted: false,
            hasCertificate: false,
          },
        ],
      },
    ])
    vi.mocked(CourseAnalysisService.getUserCourseProgressMap).mockResolvedValue(new Map())

    const fromMock = vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn(() => ({
          returns: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'course-lp-1',
                title: 'La Trampa de la Insolvencia',
                slug: 'trampa-insolvencia',
                category: 'Finanzas',
                level: 'beginner',
                duration_total_minutes: 120,
                is_active: true,
              },
            ],
            error: null,
          }),
        })),
      })),
    }))
    vi.mocked(createClient).mockResolvedValue({ from: fromMock } as never)

    const result = await buildStudyPlannerUserContext('user-1')

    expect(loadBusinessUserLearningPaths).toHaveBeenCalledWith({
      userId: 'user-1',
      organizationId: 'org-1',
    })
    expect(result.courses).toHaveLength(1)
    expect(result.courses[0]).toMatchObject({
      courseId: 'course-lp-1',
      organizationId: 'org-1',
      organizationName: 'Board Vision',
      source: 'organization',
      status: 'assigned',
    })
    expect(buildPlannedCourseKey).toHaveBeenCalledWith('course-lp-1', 'org-1')
  })
})
