import type { createClient } from '../../../../lib/supabase/server'
import { enrichWorkshops } from './workshops-query.helpers'
import type {
  CourseWorkshopRow,
  EnrollmentCourseRow,
  InstructorLookupRow,
  ModuleDurationRow,
} from './workshops-query.types'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export async function enrichWorkshopRows(
  supabase: SupabaseServerClient,
  courses: CourseWorkshopRow[],
) {
  const courseIds = courses.map((course) => course.id)
  const instructorIds = [
    ...new Set(courses.map((course) => course.instructor_id).filter(Boolean)),
  ] as string[]

  const [instructorsResult, modulesResult, assignmentsResult] = await Promise.all([
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
    supabase
      .from('user_course_enrollments')
      .select('course_id')
      .in('course_id', courseIds)
      .eq('enrollment_status', 'active')
      .returns<EnrollmentCourseRow[]>(),
  ])

  if (instructorsResult.error) throw instructorsResult.error
  if (modulesResult.error) throw modulesResult.error
  if (assignmentsResult.error) throw assignmentsResult.error

  return enrichWorkshops({
    courses,
    instructors: instructorsResult.data || [],
    modules: modulesResult.data || [],
    enrollments: assignmentsResult.data || [],
  })
}
