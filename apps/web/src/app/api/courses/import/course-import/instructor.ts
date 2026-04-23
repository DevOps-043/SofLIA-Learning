import { extractGeneratedCourseInstructorHint } from '@/lib/generated-course-instructor'
import { CourseImportError } from './errors'
import type { ServiceSupabaseClient } from './types'

async function findInstructorByColumn(
  supabase: ServiceSupabaseClient,
  column: 'id' | 'email',
  value?: string,
) {
  if (!value) return undefined

  const { data } = await supabase
    .from('users')
    .select('id')
    .eq(column, value)
    .maybeSingle()

  return data?.id
}

export async function resolveInstructorId(
  supabase: ServiceSupabaseClient,
  body: unknown,
) {
  const instructorHint = extractGeneratedCourseInstructorHint(body)
  const instructorId =
    (await findInstructorByColumn(supabase, 'id', instructorHint.instructorId)) ||
    (await findInstructorByColumn(supabase, 'email', instructorHint.email))

  if (instructorId) return instructorId

  const { data: fallbackUser } = await supabase
    .from('users')
    .select('id')
    .limit(1)
    .single()

  if (fallbackUser?.id) return fallbackUser.id

  throw new CourseImportError(500, {
    error: 'No instructor found and no default user available.',
  })
}
