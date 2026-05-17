import { extractGeneratedCourseInstructorHint } from '@/lib/generated-course-instructor'

import type { CourseImportSupabaseClient } from './service-client'

export async function resolveImportedCourseInstructorId(
  supabase: CourseImportSupabaseClient,
  body: Record<string, unknown>
): Promise<string> {
  const instructorHint = extractGeneratedCourseInstructorHint(body)
  const hintedInstructorId = await findHintedInstructorId(supabase, instructorHint)

  if (hintedInstructorId) {
    return hintedInstructorId
  }

  const { data: anyAdmin } = await supabase.from('users').select('id').limit(1).single()

  if (anyAdmin?.id) {
    return anyAdmin.id
  }

  throw new Error('No instructor found and no default user available.')
}

async function findHintedInstructorId(
  supabase: CourseImportSupabaseClient,
  instructorHint: ReturnType<typeof extractGeneratedCourseInstructorHint>
): Promise<string | undefined> {
  if (instructorHint.instructorId) {
    const { data: instructor } = await supabase
      .from('users')
      .select('id')
      .eq('id', instructorHint.instructorId)
      .maybeSingle()

    if (instructor?.id) {
      return instructor.id
    }
  }

  if (!instructorHint.email) {
    return undefined
  }

  const { data: instructor } = await supabase
    .from('users')
    .select('id')
    .eq('email', instructorHint.email)
    .maybeSingle()

  return instructor?.id
}
