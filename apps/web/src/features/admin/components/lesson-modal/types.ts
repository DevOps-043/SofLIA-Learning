import type { AdminLesson } from '../../services/adminLessons.service'

export type LessonVideoProvider = 'youtube' | 'vimeo' | 'direct' | 'custom'
export type LessonModalTab = 'basic' | 'video' | 'content'

export interface InstructorOption {
  id: string
  name: string
}

export interface LessonFormData {
  lesson_title: string
  lesson_description: string
  video_provider_id: string
  video_provider: LessonVideoProvider
  duration_seconds: number
  transcript_content: string
  summary_content: string
  is_published: boolean
  instructor_id: string
}

export interface LessonModalProps {
  lesson?: AdminLesson | null
  moduleId: string
  onClose: () => void
  onSave: (data: LessonFormData) => Promise<void>
  instructors?: InstructorOption[]
}
