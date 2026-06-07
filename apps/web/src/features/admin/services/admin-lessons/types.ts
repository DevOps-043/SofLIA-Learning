export interface AdminLesson {
  lesson_id: string
  lesson_title: string
  lesson_description: string | null
  lesson_order_index: number
  video_provider_id: string
  video_provider: 'youtube' | 'vimeo' | 'direct' | 'custom'
  duration_seconds: number
  total_duration_minutes: number
  transcript_content: string | null
  summary_content: string | null
  is_published: boolean
  module_id: string
  instructor_id: string
  instructor_name?: string
  created_at: string
  updated_at: string
}

export interface CreateLessonData {
  lesson_title: string
  lesson_description?: string
  video_provider_id: string
  video_provider: 'youtube' | 'vimeo' | 'direct' | 'custom'
  duration_seconds: number
  transcript_content?: string
  summary_content?: string
  is_published?: boolean
  instructor_id: string
}

export interface UpdateLessonData {
  module_id?: string
  lesson_title?: string
  lesson_description?: string
  video_provider_id?: string
  video_provider?: 'youtube' | 'vimeo' | 'direct' | 'custom'
  duration_seconds?: number
  transcript_content?: string
  summary_content?: string
  is_published?: boolean
  instructor_id?: string
}

export interface LessonInstructorRecord {
  id: string
  display_name?: string | null
  first_name?: string | null
  last_name?: string | null
}
