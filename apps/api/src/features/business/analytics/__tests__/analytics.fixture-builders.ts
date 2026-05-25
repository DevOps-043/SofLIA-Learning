export function assignment(
  id: string,
  userId: string,
  courseId: string,
  status: string,
  progress: number,
  completedAt: string | null,
) {
  return {
    id,
    user_id: userId,
    course_id: courseId,
    status,
    completion_percentage: progress,
    assigned_at: '2026-03-01T00:00:00.000Z',
    due_date: null,
    completed_at: completedAt,
  }
}

export function enrollment(
  enrollmentId: string,
  userId: string,
  courseId: string,
  progress: number,
  status: string,
  completedAt: string | null,
) {
  return {
    enrollment_id: enrollmentId,
    user_id: userId,
    course_id: courseId,
    overall_progress_percentage: progress,
    enrollment_status: status,
    completed_at: completedAt,
    started_at: '2026-03-01T00:00:00.000Z',
  }
}

export function lessonProgress(
  id: string,
  userId: string,
  lessonId: string,
  enrollmentId: string,
  minutes: number,
  completed: boolean,
) {
  return {
    progress_id: id,
    user_id: userId,
    lesson_id: lessonId,
    enrollment_id: enrollmentId,
    time_spent_minutes: minutes,
    is_completed: completed,
    completed_at: completed ? '2026-03-18T00:00:00.000Z' : null,
    last_accessed_at: '2026-03-18T00:00:00.000Z',
    quiz_completed: completed,
    quiz_passed: completed,
  }
}

export function dailyProgress(
  userId: string,
  date: string,
  hadActivity: boolean,
  streak: number,
  minutes: number,
  completed: number,
  missed: number,
) {
  return {
    user_id: userId,
    progress_date: date,
    had_activity: hadActivity,
    streak_count: streak,
    study_minutes: minutes,
    sessions_completed: completed,
    sessions_missed: missed,
  }
}

export function studySession(
  id: string,
  userId: string,
  minutes: number,
  status: string,
  completedAt: string | null,
) {
  return {
    id,
    user_id: userId,
    start_time: '2026-04-01T08:00:00.000Z',
    actual_duration_minutes: minutes,
    status,
    completed_at: completedAt,
    session_type: 'planner',
  }
}
