import { describe, expect, it } from 'vitest'
import { buildBusinessUserStatsResponse } from '../business-user-stats-response.service'
import type { BusinessUserStatsQueryData } from '../business-user-stats-query.service'

describe('business-user-stats-response.service', () => {
  it('builds aggregated user stats, per-course metrics and enriched certificates', () => {
    const data: BusinessUserStatsQueryData = {
      organizationUser: {
        user_id: 'user-1',
        organization_id: 'org-1',
        joined_at: '2025-01-10T00:00:00.000Z',
        role: 'member',
        job_title: 'Analista',
        users: {
          id: 'user-1',
          username: 'ana',
          email: 'ana@example.com',
          first_name: 'Ana',
          last_name: 'Ruiz',
          display_name: 'Ana Ruiz',
          profile_picture_url: null,
        },
      },
      enrollments: [
        {
          enrollment_id: 'enr-1',
          enrollment_status: 'completed',
          overall_progress_percentage: 100,
          enrolled_at: '2025-01-12T00:00:00.000Z',
          started_at: '2025-01-13T00:00:00.000Z',
          completed_at: '2025-02-10T00:00:00.000Z',
          last_accessed_at: '2025-02-10T00:00:00.000Z',
          course_id: 'course-1',
          courses: { id: 'course-1', title: 'Curso A', slug: 'curso-a' },
        },
      ],
      lessonProgress: [
        {
          progress_id: 'lp-1',
          lesson_status: 'completed',
          is_completed: true,
          time_spent_minutes: 90,
          completed_at: '2025-02-10T00:00:00.000Z',
          started_at: '2025-01-13T00:00:00.000Z',
          enrollment_id: 'enr-1',
          lesson_id: 'lesson-1',
          quiz_progress_percentage: 100,
          quiz_completed: true,
          quiz_passed: true,
          user_course_enrollments: {
            course_id: 'course-1',
            courses: { id: 'course-1', title: 'Curso A' },
          },
        },
      ],
      lessons: [
        {
          lesson_id: 'lesson-1',
          lesson_title: 'Lección 1',
          module_id: 'module-1',
          course_modules: {
            module_id: 'module-1',
            module_title: 'Módulo 1',
            module_order_index: 1,
            course_id: 'course-1',
          },
        },
      ],
      courseModules: [
        {
          module_id: 'module-1',
          module_title: 'Módulo 1',
          module_order_index: 1,
          course_id: 'course-1',
        },
        {
          module_id: 'module-2',
          module_title: 'Módulo 1',
          module_order_index: 1,
          course_id: 'course-2',
        },
      ],
      lessonCounts: [
        { lesson_id: 'lesson-1', module_id: 'module-1' },
        { lesson_id: 'lesson-2', module_id: 'module-2' },
      ],
      activityCompletions: [
        {
          completion_id: 'activity-1',
          activity_id: 'activity-1',
          status: 'completed',
          completed_steps: 3,
          total_steps: 3,
          time_to_complete_seconds: 120,
          attempts_to_complete: 1,
          completed_at: '2025-02-10T00:00:00.000Z',
          lesson_activities: {
            activity_id: 'activity-1',
            activity_title: 'Actividad',
            activity_type: 'lia',
            lesson_id: 'lesson-1',
            course_lessons: {
              lesson_id: 'lesson-1',
              module_id: 'module-1',
              course_modules: { module_id: 'module-1', course_id: 'course-1' },
            },
          },
        },
      ],
      lessonNotes: [
        {
          note_id: 'note-1',
          lesson_id: 'lesson-1',
          is_auto_generated: false,
          course_lessons: {
            lesson_id: 'lesson-1',
            module_id: 'module-1',
            course_modules: { module_id: 'module-1', course_id: 'course-1' },
          },
        },
      ],
      certificates: [
        {
          certificate_id: 'cert-1',
          certificate_url: 'https://example.com/cert-1',
          certificate_hash: 'hash-1',
          course_id: 'course-1',
          issued_at: '2025-02-12T00:00:00.000Z',
          expires_at: null,
          courses: {
            id: 'course-1',
            title: 'Curso A',
            slug: 'curso-a',
            thumbnail_url: null,
            instructor_id: 'inst-1',
          },
        },
      ],
      instructors: [
        {
          id: 'inst-1',
          first_name: 'Laura',
          last_name: 'Pérez',
          username: 'laura',
        },
      ],
      liaConversations: [
        {
          conversation_id: 'conv-1',
          course_id: 'course-1',
          lesson_id: 'lesson-1',
          started_at: '2025-02-11T10:00:00.000Z',
          ended_at: '2025-02-11T10:30:00.000Z',
          total_messages: 6,
          conversation_completed: true,
        },
      ],
      liaMessages: [
        {
          message_id: 'msg-1',
          conversation_id: 'conv-1',
          role: 'user',
          created_at: '2025-02-11T10:00:00.000Z',
        },
      ],
      quizSubmissions: [
        {
          submission_id: 'quiz-1',
          score: 8,
          total_points: 10,
          percentage_score: 80,
          is_passed: true,
          completed_at: '2025-02-10T00:00:00.000Z',
          created_at: '2025-02-10T00:00:00.000Z',
          lesson_id: 'lesson-1',
          enrollment_id: 'enr-1',
          user_course_enrollments: { course_id: 'course-1' },
        },
      ],
      assignments: [
        {
          id: 'assign-1',
          course_id: 'course-1',
          status: 'completed',
          completion_percentage: 100,
          assigned_at: '2025-01-12T00:00:00.000Z',
          due_date: null,
          completed_at: '2025-02-10T00:00:00.000Z',
          courses: { id: 'course-1', title: 'Curso A' },
        },
        {
          id: 'assign-2',
          course_id: 'course-2',
          status: 'assigned',
          completion_percentage: 0,
          assigned_at: '2025-03-01T00:00:00.000Z',
          due_date: '2025-04-01T00:00:00.000Z',
          completed_at: null,
          courses: { id: 'course-2', title: 'Curso B' },
        },
      ],
      learningPathCourseOrder: new Map(),
    }

    const response = buildBusinessUserStatsResponse(data)

    expect(response.user.display_name).toBe('Ana Ruiz')
    expect(response.stats.total_courses).toBe(2)
    expect(response.stats.completed_courses).toBe(1)
    expect(response.stats.not_started_courses).toBe(1)
    expect(response.stats.average_progress).toBe(50)
    expect(response.stats.total_time_spent_hours).toBe(1.5)
    expect(response.stats.quiz_average_score).toBe(80)
    expect(response.stats.lia_activities_completed).toBe(1)
    expect(response.courses[0]).toMatchObject({
      course_id: 'course-1',
      course_title: 'Curso A',
      notes_count: 1,
      modules_total: 1,
      lessons_total: 1,
      lessons_completed: 1,
      lia_conversations_count: 1,
      quiz_total: 1,
    })
    expect(response.courses[1]).toMatchObject({
      course_id: 'course-2',
      course_title: 'Curso B',
      progress: 0,
      is_assigned: true,
      assigned_at: '2025-03-01T00:00:00.000Z',
      due_date: '2025-04-01T00:00:00.000Z',
      modules_total: 1,
      lessons_total: 1,
    })
    expect(response.certificates[0].instructor_name).toBe('Laura Pérez')
  })

  it('orders courses by learning path sequence and leaves non-path courses last', () => {
    const enrollment = (courseId: string, title: string) => ({
      enrollment_id: `enr-${courseId}`,
      enrollment_status: 'active',
      overall_progress_percentage: 0,
      enrolled_at: null,
      started_at: null,
      completed_at: null,
      last_accessed_at: null,
      course_id: courseId,
      courses: { id: courseId, title },
    })

    const data: BusinessUserStatsQueryData = {
      organizationUser: {
        user_id: 'user-1',
        organization_id: 'org-1',
        joined_at: null,
        role: 'member',
        job_title: null,
        users: {
          id: 'user-1',
          username: 'ana',
          email: 'ana@example.com',
          first_name: null,
          last_name: null,
          display_name: 'Ana',
          profile_picture_url: null,
        },
      },
      // Insertion order here is course-1, course-2, course-3.
      enrollments: [
        enrollment('course-1', 'Curso A'),
        enrollment('course-2', 'Curso B'),
        enrollment('course-3', 'Curso C'),
      ],
      lessonProgress: [],
      lessons: [],
      courseModules: [],
      lessonCounts: [],
      activityCompletions: [],
      lessonNotes: [],
      certificates: [],
      instructors: [],
      liaConversations: [],
      liaMessages: [],
      quizSubmissions: [],
      assignments: [],
      // course-2 has no learning-path entry → must end up last.
      learningPathCourseOrder: new Map([
        ['course-3', 0],
        ['course-1', 1],
      ]),
    }

    const response = buildBusinessUserStatsResponse(data)

    expect(response.courses.map((course) => course.course_id)).toEqual([
      'course-3',
      'course-1',
      'course-2',
    ])
    expect(
      response.stats.courses_with_lessons.map((course) => course.course_id),
    ).toEqual(['course-3', 'course-1', 'course-2'])
  })
})
