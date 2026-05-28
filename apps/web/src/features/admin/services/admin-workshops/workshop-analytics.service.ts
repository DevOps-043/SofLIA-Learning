import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { createAdminClient } from '@/lib/supabase/admin'
import type {
  CourseChartData,
  CourseUserStats,
  EnrolledUser,
} from '../../components/CourseManagement/types'
import {
  buildCourseChartData,
  buildCourseUserStats,
  buildEnrolledUsers,
  type WorkshopContentCounts,
  type WorkshopEnrollmentAnalyticsRow,
  type WorkshopReviewSummary,
  type WorkshopUserProfileRow,
} from './workshop-analytics-calculations.service'

type AdminSupabaseClient = SupabaseClient<Database>

interface WorkshopAnalyticsResult {
  charts: CourseChartData
  enrolled_users: EnrolledUser[]
  stats: CourseUserStats
}

export class AdminWorkshopAnalyticsService {
  static async getWorkshopAnalytics(courseId: string): Promise<WorkshopAnalyticsResult> {
    const supabase = createAdminClient()

    const courseExists = await doesCourseExist(supabase, courseId)
    if (!courseExists) {
      throw new Error('WORKSHOP_NOT_FOUND')
    }

    const [enrollments, contentCounts, reviewSummary, certificateCount] = await Promise.all([
      fetchEnrollments(supabase, courseId),
      fetchContentCounts(supabase, courseId),
      fetchReviewSummary(supabase, courseId),
      fetchCertificateCount(supabase, courseId),
    ])

    const profilesById = await fetchProfilesById(
      supabase,
      enrollments.map((enrollment) => enrollment.user_id),
    )

    return {
      charts: buildCourseChartData(enrollments),
      enrolled_users: buildEnrolledUsers(enrollments, profilesById),
      stats: buildCourseUserStats(enrollments, contentCounts, reviewSummary, certificateCount),
    }
  }
}

async function doesCourseExist(supabase: AdminSupabaseClient, courseId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

async function fetchEnrollments(supabase: AdminSupabaseClient, courseId: string): Promise<WorkshopEnrollmentAnalyticsRow[]> {
  const { data, error } = await supabase
    .from('user_course_enrollments')
    .select(`
      completed_at,
      enrollment_id,
      enrollment_status,
      enrolled_at,
      last_accessed_at,
      overall_progress_percentage,
      started_at,
      user_id
    `)
    .eq('course_id', courseId)
    .order('enrolled_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

async function fetchProfilesById(
  supabase: AdminSupabaseClient,
  userIds: string[],
): Promise<Map<string, WorkshopUserProfileRow>> {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)))
  if (uniqueUserIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from('users')
    .select('display_name, email, id, profile_picture_url, username')
    .in('id', uniqueUserIds)

  if (error) throw error
  return new Map((data ?? []).map((profile) => [profile.id, profile]))
}

async function fetchContentCounts(supabase: AdminSupabaseClient, courseId: string): Promise<WorkshopContentCounts> {
  const { data: modules, error: modulesError } = await supabase
    .from('course_modules')
    .select('module_id')
    .eq('course_id', courseId)

  if (modulesError) throw modulesError

  const moduleIds = (modules ?? []).map((module) => module.module_id)
  if (moduleIds.length === 0) {
    return { totalActivities: 0, totalLessons: 0, totalMaterials: 0 }
  }

  const { data: lessons, error: lessonsError } = await supabase
    .from('course_lessons')
    .select('lesson_id')
    .in('module_id', moduleIds)

  if (lessonsError) throw lessonsError

  const lessonIds = (lessons ?? []).map((lesson) => lesson.lesson_id)
  if (lessonIds.length === 0) {
    return { totalActivities: 0, totalLessons: 0, totalMaterials: 0 }
  }

  const [{ count: totalMaterials, error: materialsError }, { count: totalActivities, error: activitiesError }] =
    await Promise.all([
      supabase
        .from('lesson_materials')
        .select('material_id', { count: 'exact', head: true })
        .in('lesson_id', lessonIds),
      supabase
        .from('lesson_activities')
        .select('activity_id', { count: 'exact', head: true })
        .in('lesson_id', lessonIds),
    ])

  if (materialsError) throw materialsError
  if (activitiesError) throw activitiesError

  return {
    totalActivities: totalActivities ?? 0,
    totalLessons: lessonIds.length,
    totalMaterials: totalMaterials ?? 0,
  }
}

async function fetchReviewSummary(supabase: AdminSupabaseClient, courseId: string): Promise<WorkshopReviewSummary> {
  const { data, error } = await supabase
    .from('course_reviews')
    .select('rating')
    .eq('course_id', courseId)

  if (error) throw error

  const ratings = (data ?? []).map((review) => Number(review.rating) || 0)
  const totalReviews = ratings.length

  return {
    averageRating: totalReviews > 0
      ? ratings.reduce((total, rating) => total + rating, 0) / totalReviews
      : 0,
    totalReviews,
  }
}

async function fetchCertificateCount(supabase: AdminSupabaseClient, courseId: string): Promise<number> {
  const { count, error } = await supabase
    .from('user_course_certificates')
    .select('certificate_id', { count: 'exact', head: true })
    .eq('course_id', courseId)

  if (error) throw error
  return count ?? 0
}
