import { createClient } from '../../../lib/supabase/server'
import type { BusinessCourseDetail } from '../types/business-course-detail.types'
import {
  buildBusinessCourseModules,
  mapBusinessCourseReviews,
  resolveBusinessCourseInstructorId,
} from './business-course-detail.server.helpers'
import type { BusinessCourseDetailOptions } from './business-course-detail.server.types'
import {
  fetchCourseModulesAndReviews,
  fetchCourseRow,
  fetchLessonsForModules,
} from './business-course-content-query.server.service'
import { resolveGeneratedCourseInstructor } from './business-course-generated-instructor.server.service'
import {
  fetchInstructorById,
  mapInstructor,
} from './business-course-instructor-query.server.service'
import { fetchCourseSupplements } from './business-course-supplements-query.server.service'
import { buildCourseStats } from './business-course-stats.mapper'
import { fetchSubscriptionStatus } from './business-course-subscription-status.server.service'

export class BusinessCourseDetailServerService {
  static async getCourseDetail({
    courseId,
    businessUserId,
    organizationId,
  }: BusinessCourseDetailOptions): Promise<BusinessCourseDetail | null> {
    const supabase = await createClient()
    const { data: course, error: courseError } = await fetchCourseRow(supabase, courseId)

    if (courseError) throw courseError
    if (!course) return null

    const [modulesAndReviews, subscriptionStatus] = await Promise.all([
      fetchCourseModulesAndReviews(supabase, course.id),
      fetchSubscriptionStatus(supabase, businessUserId, organizationId, course.id),
    ])
    const [modules, reviews] = modulesAndReviews
    const moduleIds = modules.map((module) => module.module_id)
    const lessons = await fetchLessonsForModules(supabase, moduleIds)
    const { materials, activities } = await fetchCourseSupplements(supabase, lessons)
    const modulesWithLessons = buildBusinessCourseModules(
      modules,
      lessons,
      materials,
      activities,
    )
    const instructorId = resolveBusinessCourseInstructorId(
      course.instructor_id,
      modulesWithLessons,
    )
    let instructorRow = instructorId
      ? await fetchInstructorById(supabase, instructorId)
      : null

    if (!instructorRow) {
      instructorRow = await resolveGeneratedCourseInstructor(supabase, course)
    }

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      instructor: mapInstructor(instructorRow),
      duration: course.duration_total_minutes,
      thumbnail_url: course.thumbnail_url,
      slug: course.slug,
      price: course.price,
      rating: course.average_rating || 0,
      student_count: course.student_count || 0,
      review_count: course.review_count || 0,
      learning_objectives: course.learning_objectives || [],
      created_at: course.created_at,
      updated_at: course.updated_at,
      stats: buildCourseStats(modulesWithLessons),
      modules: modulesWithLessons,
      reviews: mapBusinessCourseReviews(reviews),
      subscription_status: subscriptionStatus,
    }
  }
}
