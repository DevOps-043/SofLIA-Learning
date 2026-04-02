import { describe, expect, it } from 'vitest'
import {
  buildBusinessCourseModules,
  mapBusinessCourseReviews,
  resolveBusinessCourseInstructorId,
  type CourseLessonRow,
  type CourseModuleRow,
  type CourseReviewRow,
  type CourseSupplementRow
} from '../business-course-detail.server.helpers'

describe('business-course-detail.server.helpers', () => {
  it('builds modules with fallback duration from lesson seconds, materials and activities', () => {
    const modules: CourseModuleRow[] = [
      {
        module_id: 'module-1',
        module_title: 'Modulo 1',
        module_description: null,
        module_order_index: 1,
        module_duration_minutes: null,
        is_required: true
      }
    ]
    const lessons: CourseLessonRow[] = [
      {
        lesson_id: 'lesson-1',
        module_id: 'module-1',
        lesson_title: 'Leccion 1',
        lesson_description: null,
        lesson_order_index: 2,
        duration_seconds: 125,
        total_duration_minutes: null,
        video_provider: 'youtube',
        video_provider_id: 'abc',
        instructor_id: 'inst-1'
      },
      {
        lesson_id: 'lesson-2',
        module_id: 'module-1',
        lesson_title: 'Leccion 2',
        lesson_description: null,
        lesson_order_index: 1,
        duration_seconds: 0,
        total_duration_minutes: null,
        video_provider: 'vimeo',
        video_provider_id: 'def',
        instructor_id: null
      }
    ]
    const materials: CourseSupplementRow[] = [{ lesson_id: 'lesson-2', estimated_time_minutes: 10 }]
    const activities: CourseSupplementRow[] = [{ lesson_id: 'lesson-2', estimated_time_minutes: 5 }]

    const result = buildBusinessCourseModules(modules, lessons, materials, activities)

    expect(result[0].lessons.map(lesson => lesson.lesson_id)).toEqual(['lesson-2', 'lesson-1'])
    expect(result[0].calculated_duration_minutes).toBe(18)
  })

  it('prefers explicit lesson total duration over supplement aggregation', () => {
    const result = buildBusinessCourseModules(
      [
        {
          module_id: 'module-1',
          module_title: 'Modulo 1',
          module_description: null,
          module_order_index: 1,
          module_duration_minutes: null,
          is_required: true
        }
      ],
      [
        {
          lesson_id: 'lesson-1',
          module_id: 'module-1',
          lesson_title: 'Leccion 1',
          lesson_description: null,
          lesson_order_index: 1,
          duration_seconds: 30,
          total_duration_minutes: 25,
          video_provider: null,
          video_provider_id: null,
          instructor_id: null
        }
      ],
      [{ lesson_id: 'lesson-1', estimated_time_minutes: 99 }],
      [{ lesson_id: 'lesson-1', estimated_time_minutes: 99 }]
    )

    expect(result[0].calculated_duration_minutes).toBe(25)
  })

  it('falls back to the first lesson instructor and maps reviews safely', () => {
    const instructorId = resolveBusinessCourseInstructorId(null, [
      {
        module_id: 'module-1',
        module_title: 'Modulo 1',
        module_description: null,
        module_order_index: 1,
        module_duration_minutes: null,
        calculated_duration_minutes: 0,
        is_required: true,
        lessons: [
          {
            lesson_id: 'lesson-1',
            lesson_title: 'Leccion 1',
            lesson_description: null,
            lesson_order_index: 1,
            duration_seconds: 0,
            total_duration_minutes: null,
            video_provider: '',
            video_provider_id: '',
            instructor_id: 'inst-9'
          }
        ]
      }
    ])

    const reviews: CourseReviewRow[] = [
      {
        review_id: 'review-1',
        review_title: 'Excelente',
        review_content: 'Muy bueno',
        rating: 5,
        is_verified: true,
        created_at: '2026-04-01T00:00:00.000Z',
        users: {
          display_name: null,
          first_name: 'Ada',
          last_name: 'Lovelace',
          username: 'ada',
          profile_picture_url: null
        }
      }
    ]

    expect(instructorId).toBe('inst-9')
    expect(mapBusinessCourseReviews(reviews)).toEqual([
      expect.objectContaining({
        id: 'review-1',
        title: 'Excelente',
        rating: 5,
        user: { name: 'Ada Lovelace', profile_picture_url: null }
      })
    ])
  })
})
