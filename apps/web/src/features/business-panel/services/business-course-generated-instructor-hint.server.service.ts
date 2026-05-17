import type { BusinessCourseDetailSupabaseClient } from './business-course-detail.server.types'
import {
  fetchInstructorByEmail,
  fetchInstructorById,
} from './business-course-instructor-query.server.service'

export async function resolveInstructorHint(
  supabase: BusinessCourseDetailSupabaseClient,
  hint: { instructorId?: string; email?: string },
  visitedIds: Set<string>,
  visitedEmails: Set<string>,
) {
  if (hint.instructorId && !visitedIds.has(hint.instructorId)) {
    visitedIds.add(hint.instructorId)
    const instructor = await fetchInstructorById(supabase, hint.instructorId)
    if (instructor) return instructor
  }

  if (hint.email && !visitedEmails.has(hint.email)) {
    visitedEmails.add(hint.email)
    const instructor = await fetchInstructorByEmail(supabase, hint.email)
    if (instructor) return instructor
  }

  return null
}
