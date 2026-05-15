import { createClient } from '@/lib/supabase/server'
import type {
  AdminLesson,
  LessonInstructorRecord,
} from './types'

export type AdminLessonsSupabaseClient = Awaited<ReturnType<typeof createClient>>

export const ADMIN_LESSON_SELECT_FIELDS = `
  lesson_id,
  lesson_title,
  lesson_description,
  lesson_order_index,
  video_provider_id,
  video_provider,
  duration_seconds,
  total_duration_minutes,
  transcript_content,
  summary_content,
  is_published,
  module_id,
  instructor_id,
  created_at,
  updated_at
`

const ADMIN_INSTRUCTOR_SELECT_FIELDS = 'id, display_name, first_name, last_name'

export async function fetchInstructorNameMap(
  supabase: AdminLessonsSupabaseClient,
  instructorIds: string[],
): Promise<Map<string, string>> {
  const uniqueInstructorIds = Array.from(
    new Set(instructorIds.filter((instructorId) => Boolean(instructorId))),
  )

  if (uniqueInstructorIds.length === 0) {
    return new Map()
  }

  const { data, error } = await supabase
    .from('users')
    .select(ADMIN_INSTRUCTOR_SELECT_FIELDS)
    .in('id', uniqueInstructorIds)

  if (error) {
    throw error
  }

  return new Map(
    ((data || []) as LessonInstructorRecord[]).map((instructor) => [
      instructor.id,
      buildInstructorName(instructor),
    ]),
  )
}

export function enrichLessonWithInstructorName(
  lesson: AdminLesson,
  instructorNameMap: Map<string, string>,
  missingInstructorFallback?: string,
): AdminLesson {
  if (!lesson.instructor_id) {
    return missingInstructorFallback
      ? { ...lesson, instructor_name: missingInstructorFallback }
      : lesson
  }

  return {
    ...lesson,
    instructor_name:
      instructorNameMap.get(lesson.instructor_id) ||
      missingInstructorFallback ||
      'Instructor',
  }
}

export function hydrateLessonVideoProviderId(lesson: AdminLesson): AdminLesson {
  if (
    lesson.video_provider !== 'direct' ||
    !lesson.video_provider_id ||
    lesson.video_provider_id.startsWith('http')
  ) {
    return lesson
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    return lesson
  }

  const videoProviderId = lesson.video_provider_id.includes('/')
    ? `${supabaseUrl}/storage/v1/object/public/${lesson.video_provider_id}`
    : `${supabaseUrl}/storage/v1/object/public/course-videos/videos/${lesson.video_provider_id}`

  return {
    ...lesson,
    video_provider_id: videoProviderId,
  }
}

export function normalizeDirectVideoProviderId(
  videoProviderId: string,
  videoProvider: AdminLesson['video_provider'],
): string {
  if (
    videoProvider !== 'direct' ||
    !videoProviderId.includes('supabase.co/storage/v1/object/public/')
  ) {
    return videoProvider === 'direct' ? videoProviderId : truncateVideoProviderId(videoProviderId)
  }

  const publicIndex = videoProviderId.indexOf('/public/')
  if (publicIndex === -1) {
    return videoProviderId
  }

  return videoProviderId.substring(publicIndex + 8)
}

function buildInstructorName(instructor: LessonInstructorRecord): string {
  return (
    instructor.display_name ||
    `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
    'Instructor'
  )
}

function truncateVideoProviderId(videoProviderId: string): string {
  return videoProviderId.length > 50
    ? videoProviderId.substring(0, 50)
    : videoProviderId
}
