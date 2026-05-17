export interface AdminModule {
  module_id: string
  module_title: string
  module_description: string | null
  module_order_index: number
  module_duration_minutes: number
  is_required: boolean
  is_published: boolean
  course_id: string
  created_at: string
  updated_at: string
  lessons?: AdminLesson[]
}

export interface AdminLesson {
  lesson_id: string
  lesson_title: string
  lesson_description: string | null
  lesson_order_index: number
  video_provider_id: string
  video_provider: 'youtube' | 'vimeo' | 'direct' | 'custom'
  duration_seconds: number
  transcript_content: string | null
  summary_content: string | null
  is_published: boolean
  module_id: string
  instructor_id: string
  instructor_name?: string
  created_at: string
  updated_at: string
}

export interface CreateModuleData {
  module_title: string
  module_description?: string
  is_required?: boolean
  is_published?: boolean
}

export interface UpdateModuleData {
  module_title?: string
  module_description?: string
  is_required?: boolean
  is_published?: boolean
}
