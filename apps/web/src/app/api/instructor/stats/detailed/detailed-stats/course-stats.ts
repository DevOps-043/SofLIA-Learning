import { getDayKey } from './date-range'
import { groupBy, incrementCounter } from './map-utils'
import type { CountMap, SupabaseServerClient } from './shared-types'

function createCourseStats(totalCourses: number) {
  return {
    totalCourses,
    totalStudents: 0,
    averageRating: 0,
    totalRevenue: 0,
    studentsByCourse: [] as Array<{ courseId: string; courseTitle: string; studentCount: number }>,
    progressByCourse: [] as Array<{ courseId: string; courseTitle: string; averageProgress: number }>,
    completionByCourse: [] as Array<{ courseId: string; courseTitle: string; completionRate: number }>,
    ratingsByCourse: [] as Array<{ courseId: string; courseTitle: string; averageRating: number }>,
    revenueByCourse: [] as Array<{ courseId: string; courseTitle: string; revenue: number }>,
    enrollmentsByDate: {} as CountMap,
  }
}

export async function getCourseStats(
  supabase: SupabaseServerClient,
  instructorId: string,
  courseIds: string[],
  startDate: Date,
  endDate: Date,
) {
  const stats = createCourseStats(courseIds.length)
  if (!courseIds.length) return stats

  const startIso = startDate.toISOString()
  const endIso = endDate.toISOString()
  const [{ data: courses }, { data: enrollments }, { data: purchases }] = await Promise.all([
    supabase.from('courses').select('id, title, student_count, average_rating').eq('instructor_id', instructorId).gte('created_at', startIso).lte('created_at', endIso),
    supabase.from('user_course_enrollments').select('course_id, overall_progress_percentage, enrollment_status, enrolled_at').in('course_id', courseIds).gte('enrolled_at', startIso).lte('enrolled_at', endIso),
    supabase.from('course_purchases').select('course_id, final_price_cents').in('course_id', courseIds).eq('access_status', 'active').gte('purchased_at', startIso).lte('purchased_at', endIso),
  ])

  const courseList = courses ?? []
  const enrollmentList = enrollments ?? []
  const purchaseList = purchases ?? []
  const enrollmentsByCourse = groupBy(enrollmentList, (row) => row.course_id)
  const purchasesByCourse = groupBy(purchaseList, (row) => row.course_id)

  enrollmentList.forEach((enrollment) => incrementCounter(stats.enrollmentsByDate, getDayKey(enrollment.enrolled_at)))
  courseList.forEach((course) => {
    const courseEnrollments = enrollmentsByCourse.get(course.id) ?? []
    const coursePurchases = purchasesByCourse.get(course.id) ?? []
    const totalProgress = courseEnrollments.reduce((sum, row) => sum + (Number(row.overall_progress_percentage) || 0), 0)
    const completed = courseEnrollments.filter((row) => row.enrollment_status === 'completed' || (Number(row.overall_progress_percentage) || 0) >= 100).length
    const revenue = coursePurchases.reduce((sum, row) => sum + ((row.final_price_cents || 0) / 100), 0)

    stats.totalStudents += course.student_count || 0
    stats.totalRevenue += revenue
    stats.studentsByCourse.push({ courseId: course.id, courseTitle: course.title, studentCount: course.student_count || 0 })
    stats.progressByCourse.push({ courseId: course.id, courseTitle: course.title, averageProgress: courseEnrollments.length ? totalProgress / courseEnrollments.length : 0 })
    stats.completionByCourse.push({ courseId: course.id, courseTitle: course.title, completionRate: courseEnrollments.length ? (completed / courseEnrollments.length) * 100 : 0 })
    stats.revenueByCourse.push({ courseId: course.id, courseTitle: course.title, revenue })
    if (course.average_rating) {
      stats.ratingsByCourse.push({ courseId: course.id, courseTitle: course.title, averageRating: course.average_rating })
    }
  })

  const ratedCourses = courseList.filter((course) => (course.average_rating || 0) > 0)
  stats.averageRating = ratedCourses.length
    ? ratedCourses.reduce((sum, course) => sum + (course.average_rating || 0), 0) / ratedCourses.length
    : 0

  return stats
}
