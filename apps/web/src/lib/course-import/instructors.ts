import { extractGeneratedCourseInstructorHint } from '../generated-course-instructor'
import type { createAdminSupabase } from './admin-client'

type AdminSupabaseClient = ReturnType<typeof createAdminSupabase>

export async function resolveInstructor(
  supabase: AdminSupabaseClient,
  email?: string,
): Promise<string> {
  if (email) {
    const { data } = await supabase.from('users').select('id').eq('email', email).single()
    if (data?.id) return data.id
  }

  const { data } = await supabase.from('users').select('id').limit(1).single()
  if (!data?.id) throw new Error('[courseImport] No users found in database')
  return data.id
}

export async function resolveInstructorFromPayload(
  supabase: AdminSupabaseClient,
  payload: unknown,
): Promise<string> {
  const hint = extractGeneratedCourseInstructorHint(payload)

  if (hint.instructorId) {
    const { data } = await supabase.from('users').select('id').eq('id', hint.instructorId).maybeSingle()
    if (data?.id) return data.id
  }

  if (hint.email) {
    const { data } = await supabase.from('users').select('id').eq('email', hint.email).maybeSingle()
    if (data?.id) return data.id
  }

  return resolveInstructor(supabase)
}
