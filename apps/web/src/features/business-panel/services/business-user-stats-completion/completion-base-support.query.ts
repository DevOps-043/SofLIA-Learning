import type { BusinessUserStatsSupabaseClient } from './completion.client'
import type {
  BusinessUserStatsCertificateRecord,
  BusinessUserStatsLessonNoteRecord,
} from './completion.records'

export function fetchLessonNoteRows(
  supabase: BusinessUserStatsSupabaseClient,
  userId: string,
) {
  return supabase
    .from('user_lesson_notes')
    .select(`
      note_id,
      lesson_id,
      is_auto_generated,
      course_lessons (
        lesson_id,
        module_id,
        course_modules (
          module_id,
          course_id
        )
      )
    `)
    .eq('user_id', userId)
}

export function fetchCertificateRows(
  supabase: BusinessUserStatsSupabaseClient,
  userId: string,
) {
  return supabase
    .from('user_course_certificates')
    .select(`
      certificate_id,
      certificate_url,
      certificate_hash,
      course_id,
      issued_at,
      expires_at,
      courses (
        id,
        title,
        slug,
        thumbnail_url,
        instructor_id
      )
    `)
    .eq('user_id', userId)
    .order('issued_at', { ascending: false })
}

export function toLessonNoteRecords(data: unknown): BusinessUserStatsLessonNoteRecord[] {
  return (data || []) as BusinessUserStatsLessonNoteRecord[]
}

export function toCertificateRecords(data: unknown): BusinessUserStatsCertificateRecord[] {
  return (data || []) as BusinessUserStatsCertificateRecord[]
}
