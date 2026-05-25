import type { BusinessUserStatsQueryData } from '../business-user-stats-query.service'
import {
  createAssignment,
  createEnrollment,
  createStatsData,
} from './business-user-stats-response.fixtures'

export function createAggregatedStatsData(): BusinessUserStatsQueryData {
  return createStatsData({
    enrollments: [
      createEnrollment('course-1', 'Curso A', {
        enrollment_id: 'enr-1',
        enrollment_status: 'completed',
        overall_progress_percentage: 100,
        enrolled_at: '2025-01-12T00:00:00.000Z',
        started_at: '2025-01-13T00:00:00.000Z',
        completed_at: '2025-02-10T00:00:00.000Z',
        last_accessed_at: '2025-02-10T00:00:00.000Z',
        courses: { id: 'course-1', title: 'Curso A', slug: 'curso-a' },
      }),
    ],
    lessonProgress: [{
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
      user_course_enrollments: { course_id: 'course-1', courses: { id: 'course-1', title: 'Curso A' } },
    }] as BusinessUserStatsQueryData['lessonProgress'],
    lessons: [{
      lesson_id: 'lesson-1',
      lesson_title: 'Lección 1',
      module_id: 'module-1',
      course_modules: { module_id: 'module-1', module_title: 'Módulo 1', module_order_index: 1, course_id: 'course-1' },
    }] as BusinessUserStatsQueryData['lessons'],
    courseModules: [
      { module_id: 'module-1', module_title: 'Módulo 1', module_order_index: 1, course_id: 'course-1' },
      { module_id: 'module-2', module_title: 'Módulo 1', module_order_index: 1, course_id: 'course-2' },
    ],
    lessonCounts: [
      { lesson_id: 'lesson-1', module_id: 'module-1' },
      { lesson_id: 'lesson-2', module_id: 'module-2' },
    ],
    activityCompletions: [{
      completion_id: 'activity-1',
      activity_id: 'activity-1',
      status: 'completed',
      completed_steps: 3,
      total_steps: 3,
      time_to_complete_seconds: 120,
      attempts_to_complete: 1,
      completed_at: '2025-02-10T00:00:00.000Z',
      lesson_activities: { activity_id: 'activity-1', activity_title: 'Actividad', activity_type: 'lia', lesson_id: 'lesson-1', course_lessons: { lesson_id: 'lesson-1', module_id: 'module-1', course_modules: { module_id: 'module-1', course_id: 'course-1' } } },
    }] as BusinessUserStatsQueryData['activityCompletions'],
    lessonNotes: [{ note_id: 'note-1', lesson_id: 'lesson-1', is_auto_generated: false, course_lessons: { lesson_id: 'lesson-1', module_id: 'module-1', course_modules: { module_id: 'module-1', course_id: 'course-1' } } }] as BusinessUserStatsQueryData['lessonNotes'],
    certificates: [{ certificate_id: 'cert-1', certificate_url: 'https://example.com/cert-1', certificate_hash: 'hash-1', course_id: 'course-1', issued_at: '2025-02-12T00:00:00.000Z', expires_at: null, courses: { id: 'course-1', title: 'Curso A', slug: 'curso-a', thumbnail_url: null, instructor_id: 'inst-1' } }] as BusinessUserStatsQueryData['certificates'],
    instructors: [{ id: 'inst-1', first_name: 'Laura', last_name: 'Pérez', username: 'laura' }] as BusinessUserStatsQueryData['instructors'],
    liaConversations: [{ conversation_id: 'conv-1', course_id: 'course-1', lesson_id: 'lesson-1', started_at: '2025-02-11T10:00:00.000Z', ended_at: '2025-02-11T10:30:00.000Z', total_messages: 6, conversation_completed: true }],
    liaMessages: [{ message_id: 'msg-1', conversation_id: 'conv-1', role: 'user', created_at: '2025-02-11T10:00:00.000Z' }],
    quizSubmissions: [{ submission_id: 'quiz-1', score: 8, total_points: 10, percentage_score: 80, is_passed: true, completed_at: '2025-02-10T00:00:00.000Z', created_at: '2025-02-10T00:00:00.000Z', lesson_id: 'lesson-1', enrollment_id: 'enr-1', user_course_enrollments: { course_id: 'course-1' } }],
    assignments: [
      createAssignment('assign-1', 'course-1', 'Curso A', { status: 'completed', completion_percentage: 100, completed_at: '2025-02-10T00:00:00.000Z' }),
      createAssignment('assign-2', 'course-2', 'Curso B', { assigned_at: '2025-03-01T00:00:00.000Z', due_date: '2025-04-01T00:00:00.000Z' }),
    ],
  })
}
