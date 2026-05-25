export interface StudyPlannerMyCourseRecord {
  course_id?: string
  id?: string
  courses?: {
    slug?: string | null
  } | null
  slug?: string | null
  enrollment_id?: string | null
}

export interface StudyPlannerMyCoursesPayload {
  courses?: StudyPlannerMyCourseRecord[]
}

export interface StudyPlannerModulesPayload {
  modules?: Array<{
    lessons?: Array<{
      lesson_id?: string
      lessonId?: string
      lesson_title?: string
      lessonTitle?: string
      is_published?: boolean
    }>
  }>
}

export interface StudyPlannerProgressPayload {
  completedLessonIds?: string[]
}

export interface CalculateStudyPlannerCourseWorkloadInput {
  selectedCourseIds: string[]
}
