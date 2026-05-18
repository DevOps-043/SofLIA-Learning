import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export type CourseImportSupabaseClient = ReturnType<typeof createServiceClient>

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      '[IMPORT API] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  return createSupabaseClient(url, serviceKey)
}

export async function rollbackImportedCourse(
  supabase: CourseImportSupabaseClient,
  courseId: string
) {
  await supabase.from('courses').delete().eq('id', courseId)
}
