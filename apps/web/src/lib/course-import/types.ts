export interface QuizQuestionLike {
  id?: string
  question?: string
  questionText?: string
  questionType?: string
  type?: string
  options?: unknown
  correctAnswer?: string | number
  correct_answer?: string | number
  explanation?: string
  points?: number | string
}

export interface QuizSourceData extends Record<string, unknown> {
  questions?: QuizQuestionLike[]
  items?: QuizQuestionLike[]
  passing_score?: number | string
}

export interface CourseEngineMaterial {
  title: string
  type: string
  url?: string | null
  description?: string | null
  data?: unknown
}

export interface CourseEngineActivity {
  activity_config?: unknown
  activity_schema_version?: number | null
  title: string
  type: string
  data?: unknown
  estimated_time_minutes?: number | null
  is_required?: boolean | null
}

export interface CourseEngineLesson {
  order_index: number
  title: string
  video_url?: string | null
  duration?: number | null
  transcription?: string | null
  summary?: string | null
  materials?: CourseEngineMaterial[]
  activities?: CourseEngineActivity[]
}

export interface CourseEngineModule {
  order_index: number
  title: string
  description?: string | null
  lessons?: CourseEngineLesson[]
}

export interface CourseEngineCourseData {
  title: string
  description?: string | null
  category?: string | null
  level?: string | null
  thumbnail_url?: string | null
  slug?: string
  price?: number | null
  instructor_email?: string | null
}

export interface CourseEnginePayload {
  source?: Record<string, string | null | undefined>
  course: CourseEngineCourseData
  modules?: CourseEngineModule[]
}

export interface StagingCoursePreview {
  id: string
  status?: string
  is_update?: boolean
  payload?: Partial<CourseEnginePayload> | null
  course?: {
    instructor?: {
      first_name?: string
      last_name?: string
      email?: string
      display_name?: string
    } | null
  } | null
}
