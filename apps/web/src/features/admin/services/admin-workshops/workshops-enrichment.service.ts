import type { createAdminClient } from '../../../../lib/supabase/admin'
import { getCourseEnrollmentCounts } from '@/features/courses/services/course-enrollment-counts.server.service'
import { enrichWorkshops } from './workshops-query.helpers'
import type {
  CourseWorkshopRow,
  InstructorLookupRow,
  ModuleDurationRow,
} from './workshops-query.types'

type SupabaseServerClient = ReturnType<typeof createAdminClient>

export async function enrichWorkshopRows(
  supabase: SupabaseServerClient,
  courses: CourseWorkshopRow[],
) {
  const courseIds = courses.map((course) => course.id)
  const instructorIds = [
    ...new Set(courses.map((course) => course.instructor_id).filter(Boolean)),
  ] as string[]

  const [instructorsResult, modulesResult, enrollmentCounts] = await Promise.all([
    instructorIds.length > 0
      ? supabase
          .from('users')
          .select('id, display_name, first_name, last_name, profile_picture_url')
          .in('id', instructorIds)
          .returns<InstructorLookupRow[]>()
      : Promise.resolve({ data: [] as InstructorLookupRow[], error: null }),
    supabase
      .from('course_modules')
      .select('course_id, module_duration_minutes')
      .in('course_id', courseIds)
      .returns<ModuleDurationRow[]>(),
    getCourseEnrollmentCounts(supabase, courseIds),
  ])

  if (instructorsResult.error) throw instructorsResult.error
  if (modulesResult.error) throw modulesResult.error

  return enrichWorkshops({
    courses,
    instructors: instructorsResult.data || [],
    modules: modulesResult.data || [],
    enrollmentCounts,
  })
}
