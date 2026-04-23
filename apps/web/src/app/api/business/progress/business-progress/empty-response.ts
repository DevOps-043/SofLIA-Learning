import { NextResponse } from 'next/server'

export function createEmptyProgressResponse() {
  return NextResponse.json({
    success: true,
    stats: {
      total_users: 0,
      total_courses_assigned: 0,
      completed_courses: 0,
      average_progress: 0,
      total_time_spent_hours: 0,
      completion_rate: 0,
    },
    courses: [],
    users: [],
    charts: {
      distribution: [],
      progress_by_course: [],
      progress_by_user: [],
      completion_trends: [],
      time_by_course: [],
    },
  })
}
