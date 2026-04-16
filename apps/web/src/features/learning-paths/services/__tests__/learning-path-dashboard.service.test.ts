import { describe, expect, it } from 'vitest'
import { buildBusinessUserLearningPaths } from '../learning-path-dashboard.service'

describe('buildBusinessUserLearningPaths', () => {
  it('builds sequential item states and next available course', () => {
    const [learningPath] = buildBusinessUserLearningPaths({
      organizationId: 'org-1',
      paths: [
        {
          id: 'path-1',
          title: 'Ruta de ventas',
          description: 'Secuencia comercial',
          is_active: true,
        },
      ],
      items: [
        {
          id: 'item-3',
          learning_path_id: 'path-1',
          course_id: 'course-3',
          position: 3,
          courses: { id: 'course-3', title: 'Cierre', slug: 'cierre' },
        },
        {
          id: 'item-1',
          learning_path_id: 'path-1',
          course_id: 'course-1',
          position: 1,
          courses: { id: 'course-1', title: 'Fundamentos', slug: 'fundamentos' },
        },
        {
          id: 'item-2',
          learning_path_id: 'path-1',
          course_id: 'course-2',
          position: 2,
          courses: { id: 'course-2', title: 'Prospeccion', slug: 'prospeccion' },
        },
      ],
      enrollments: [
        {
          course_id: 'course-1',
          organization_id: 'org-1',
          overall_progress_percentage: 100,
          enrollment_status: 'completed',
        },
        {
          course_id: 'course-2',
          organization_id: 'org-1',
          overall_progress_percentage: 25,
          enrollment_status: 'active',
        },
      ],
      certificates: [{ course_id: 'course-1' }],
    })

    expect(learningPath).toBeDefined()
    expect(learningPath?.progressPercentage).toBe(42)
    expect(learningPath?.completedItemsCount).toBe(1)
    expect(learningPath?.nextCourseSlug).toBe('prospeccion')
    expect(learningPath?.items.map((item) => item.status)).toEqual([
      'completed',
      'available',
      'locked',
    ])
    expect(learningPath?.items[0]?.hasCertificate).toBe(true)
  })

  it('prefers organization-matching enrollments when duplicates exist', () => {
    const [learningPath] = buildBusinessUserLearningPaths({
      organizationId: 'org-2',
      paths: [{ id: 'path-1', title: 'Ruta', description: null, is_active: true }],
      items: [
        {
          id: 'item-1',
          learning_path_id: 'path-1',
          course_id: 'course-1',
          position: 1,
          courses: { id: 'course-1', title: 'Curso', slug: 'curso' },
        },
      ],
      enrollments: [
        {
          course_id: 'course-1',
          organization_id: 'org-1',
          overall_progress_percentage: 100,
          enrollment_status: 'completed',
        },
        {
          course_id: 'course-1',
          organization_id: 'org-2',
          overall_progress_percentage: 40,
          enrollment_status: 'active',
        },
      ],
      certificates: [],
    })

    expect(learningPath?.progressPercentage).toBe(40)
    expect(learningPath?.items[0]?.progress).toBe(40)
    expect(learningPath?.items[0]?.status).toBe('available')
  })

  it('omits inactive and empty learning paths', () => {
    const learningPaths = buildBusinessUserLearningPaths({
      paths: [
        { id: 'inactive', title: 'Inactiva', description: null, is_active: false },
        { id: 'empty', title: 'Vacia', description: null, is_active: true },
      ],
      items: [],
      enrollments: [],
      certificates: [],
    })

    expect(learningPaths).toEqual([])
  })
})
