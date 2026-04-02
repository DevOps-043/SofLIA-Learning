import {
  AcademicCapIcon,
  DocumentTextIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline'
import type { AdminLesson } from '../../services/adminLessons.service'
import type {
  InstructorOption,
  LessonFormData,
  LessonModalTab,
  LessonVideoProvider,
} from './types'

export function createLessonFormData(
  lesson?: AdminLesson | null,
  instructors: InstructorOption[] = [],
): LessonFormData {
  if (lesson) {
    return {
      lesson_title: lesson.lesson_title,
      lesson_description: lesson.lesson_description || '',
      video_provider_id: lesson.video_provider_id,
      video_provider: lesson.video_provider,
      duration_seconds: lesson.duration_seconds,
      transcript_content: lesson.transcript_content || '',
      summary_content: lesson.summary_content || '',
      is_published: lesson.is_published,
      instructor_id: lesson.instructor_id,
    }
  }

  return {
    lesson_title: '',
    lesson_description: '',
    video_provider_id: '',
    video_provider: 'youtube',
    duration_seconds: 0,
    transcript_content: '',
    summary_content: '',
    is_published: false,
    instructor_id: instructors[0]?.id || '',
  }
}

export function formatLessonDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function parseLessonDuration(duration: string): number {
  const [minutes, seconds] = duration.split(':').map(Number)
  return minutes * 60 + (seconds || 0)
}

export function canGenerateLessonAi(
  provider: LessonVideoProvider,
  videoUrl: string,
): boolean {
  return (
    (provider === 'direct' || provider === 'custom') &&
    videoUrl.startsWith('http')
  )
}

export function validateLessonForm(formData: LessonFormData): string | null {
  if (!formData.instructor_id) {
    return 'Debe seleccionar un instructor'
  }

  if (!formData.duration_seconds || formData.duration_seconds <= 0) {
    return 'La duración debe ser mayor a 0 segundos'
  }

  return null
}

export const lessonModalTabs: Array<{
  id: LessonModalTab
  label: string
  icon: typeof AcademicCapIcon
}> = [
  { id: 'basic', label: 'Básica', icon: AcademicCapIcon },
  { id: 'video', label: 'Video', icon: VideoCameraIcon },
  { id: 'content', label: 'Contenido', icon: DocumentTextIcon },
]
