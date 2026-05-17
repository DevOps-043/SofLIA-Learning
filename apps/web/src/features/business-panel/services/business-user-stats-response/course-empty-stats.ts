import type { BusinessUserStatsCourseData } from '../../types/business-user-stats.types'

interface EmptyCourseStatsInput {
  assignedAt?: string | null
  assignmentStatus?: string | null
  completedAt: string | null
  courseId: string
  dueDate?: string | null
  enrolledAt: string | null
  hasCertificate: boolean
  isAssigned?: boolean
  progress: number
  status: string
  title: string | null | undefined
}

export function createEmptyCourseStats({
  courseId,
  title,
  progress,
  status,
  enrolledAt,
  assignedAt,
  dueDate,
  completedAt,
  assignmentStatus,
  isAssigned = false,
  hasCertificate,
}: EmptyCourseStatsInput): BusinessUserStatsCourseData {
  return {
    course_id: courseId,
    course_title: title || 'Curso desconocido',
    progress,
    status,
    assignment_status: assignmentStatus,
    enrolled_at: enrolledAt,
    assigned_at: assignedAt,
    due_date: dueDate,
    completed_at: completedAt,
    is_assigned: isAssigned,
    has_certificate: hasCertificate,
    lia_conversations_count: 0,
    lia_messages_count: 0,
    lia_avg_duration_minutes: 0,
    lia_last_conversation: null,
    quiz_total: 0,
    quiz_passed: 0,
    quiz_failed: 0,
    quiz_average_score: 0,
    quiz_best_score: 0,
    quiz_total_attempts: 0,
    lia_activities_completed: 0,
    notes_count: 0,
    time_spent_minutes: 0,
    modules_total: 0,
    modules_completed: 0,
    lessons_total: 0,
    lessons_completed: 0,
    lessons_in_progress: 0,
    activities_completed: 0,
    activities_total: 0,
    readings_viewed: 0,
    quiz_lessons_completed: 0,
  }
}
