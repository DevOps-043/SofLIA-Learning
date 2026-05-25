export interface CourseUserStats {
  total_enrolled: number
  completion_rate: number
  average_progress: number
  average_rating: number
  total_reviews: number
  total_lessons: number
  total_materials: number
  total_activities: number
  retention_rate: number
  active_7d: number
  active_30d: number
  total_certificates: number
  completed: number
  in_progress: number
  not_started: number
}

export interface CourseStudentStatusPoint {
  mes: string
  completados: number
  enProgreso: number
  noIniciados: number
}

export interface CourseChartData {
  student_status_by_month: CourseStudentStatusPoint[]
}
