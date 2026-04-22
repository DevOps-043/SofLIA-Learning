import { describe, expect, it } from 'vitest'

import { getStudyPlannerPlannableCourses } from '../study-planner-plannable-courses.service'

describe('getStudyPlannerPlannableCourses', () => {
  it('keeps duplicated workshops when they belong to different organizations', () => {
    const result = getStudyPlannerPlannableCourses([
      {
        courseId: 'course-1',
        course: {
          id: 'course-1',
          title: 'Taller Duplicado',
          slug: 'taller-duplicado',
          category: 'IA',
          level: 'beginner',
          durationTotalMinutes: 60,
          isActive: true,
        },
        userType: 'b2b',
        organizationId: 'org-1',
        organizationName: 'Empresa A',
        status: 'assigned',
        completionPercentage: 10,
        source: 'organization',
      },
      {
        courseId: 'course-1',
        course: {
          id: 'course-1',
          title: 'Taller Duplicado',
          slug: 'taller-duplicado',
          category: 'IA',
          level: 'beginner',
          durationTotalMinutes: 60,
          isActive: true,
        },
        userType: 'b2b',
        organizationId: 'org-2',
        organizationName: 'Empresa B',
        status: 'assigned',
        completionPercentage: 0,
        source: 'organization',
      },
    ])

    expect(result).toHaveLength(2)
    expect(result.map((course) => course.organizationName)).toEqual([
      'Empresa A',
      'Empresa B',
    ])
  })

  it('removes completed and already planned assignments', () => {
    const result = getStudyPlannerPlannableCourses([
      {
        courseId: 'course-1',
        course: {
          id: 'course-1',
          title: 'Curso completo',
          slug: 'curso-completo',
          category: 'IA',
          level: 'beginner',
          durationTotalMinutes: 60,
          isActive: true,
        },
        userType: 'b2b',
        organizationId: 'org-1',
        organizationName: 'Empresa A',
        status: 'completed',
        completionPercentage: 100,
        source: 'organization',
      },
      {
        courseId: 'course-2',
        course: {
          id: 'course-2',
          title: 'Curso con plan',
          slug: 'curso-con-plan',
          category: 'IA',
          level: 'beginner',
          durationTotalMinutes: 60,
          isActive: true,
        },
        userType: 'b2b',
        organizationId: 'org-1',
        organizationName: 'Empresa A',
        hasActivePlan: true,
        status: 'assigned',
        completionPercentage: 10,
        source: 'organization',
      },
      {
        courseId: 'course-3',
        course: {
          id: 'course-3',
          title: 'Curso vigente',
          slug: 'curso-vigente',
          category: 'IA',
          level: 'beginner',
          durationTotalMinutes: 60,
          isActive: true,
        },
        userType: 'b2b',
        organizationId: 'org-1',
        organizationName: 'Empresa A',
        status: 'assigned',
        completionPercentage: 10,
        source: 'organization',
      },
    ])

    expect(result).toHaveLength(1)
    expect(result[0]?.courseId).toBe('course-3')
  })
})
