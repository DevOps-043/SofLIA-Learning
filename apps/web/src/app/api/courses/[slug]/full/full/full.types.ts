import type { NextRequest } from 'next/server'
import type { createClient } from '@/lib/supabase/server'
import type { SessionService } from '@/features/auth/services/session.service'
import type { CourseService } from '@/features/courses/services/course.service'
import type { SupportedLanguage } from '@/core/i18n/i18n'

export type FullSupabaseClient = Awaited<ReturnType<typeof createClient>>
export type FullCurrentUser = Awaited<ReturnType<typeof SessionService.getCurrentUser>>
export type CourseData = NonNullable<Awaited<ReturnType<typeof CourseService.getCourseBySlug>>>

export interface FullRouteContext {
  params: Promise<{ slug: string }>
}

export interface FullCourseRequest {
  request: NextRequest
  supabase: FullSupabaseClient
  slug: string
  language: SupportedLanguage
  effectiveUserId?: string
}

export interface CourseModuleRow {
  module_id: string
  module_title: string
  module_order_index: number
  module_duration_minutes?: number | null
  is_published?: boolean | null
}

export interface CourseLessonRow {
  lesson_id: string
  lesson_title: string
  lesson_description?: string | null
  lesson_order_index: number
  duration_seconds?: number | null
  total_duration_minutes?: number | null
  video_provider_id?: string | null
  video_provider?: string | null
  is_published?: boolean | null
  module_id: string
}

export interface LessonProgressRow {
  lesson_id: string
  is_completed?: boolean | null
  video_progress_percentage?: number | null
}

export interface EnrollmentRow {
  enrollment_id: string
  overall_progress_percentage: number | null
}

export interface CourseSkillRow {
  id: string
  is_primary?: boolean | null
  is_required?: boolean | null
  proficiency_level?: string | null
  display_order?: number | null
  skills?: {
    skill_id?: string
    name?: string
    slug?: string
    description?: string
    category?: string
    icon_url?: string | null
    icon_type?: string | null
    icon_name?: string | null
    color?: string | null
    level?: string | null
  } | null
}
