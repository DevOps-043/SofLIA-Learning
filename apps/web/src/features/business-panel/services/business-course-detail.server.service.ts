import { createClient } from '../../../lib/supabase/server'
import { logger } from '../../../lib/logger'
import { SubscriptionService } from './subscription.service'
import {
  buildBusinessCourseModules,
  mapBusinessCourseReviews,
  resolveBusinessCourseInstructorId,
  type CourseLessonRow,
  type CourseModuleRow,
  type CourseReviewRow,
  type CourseSupplementRow
} from './business-course-detail.server.helpers'
import type { BusinessCourseDetail, BusinessCourseInstructor, BusinessCourseSubscriptionStatus } from '../types/business-course-detail.types'

type CourseRow = {
  id: string
  title: string
  description: string | null
  category: string | null
  level: string | null
  instructor_id: string | null
  duration_total_minutes: number | null
  thumbnail_url: string | null
  slug: string | null
  price: number | null
  average_rating: number | null
  student_count: number | null
  review_count: number | null
  learning_objectives: string[] | null
  created_at: string
  updated_at: string
}

type InstructorRow = {
  id: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  username: string | null
  email: string | null
  profile_picture_url: string | null
  bio: string | null
  linkedin_url: string | null
  github_url: string | null
  website_url: string | null
  location: string | null
  cargo_rol: string | null
  type_rol: string | null
}

interface BusinessCourseDetailOptions {
  courseId: string
  businessUserId: string
  organizationId?: string
}

function mapInstructor(instructor: InstructorRow | null): BusinessCourseInstructor | null {
  if (!instructor) {
    return null
  }

  return {
    id: instructor.id,
    name:
      instructor.display_name ||
      `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
      instructor.username ||
      'Instructor',
    email: instructor.email || '',
    profile_picture_url: instructor.profile_picture_url,
    bio: instructor.bio,
    linkedin_url: instructor.linkedin_url,
    github_url: instructor.github_url,
    website_url: instructor.website_url,
    location: instructor.location,
    cargo_rol: instructor.cargo_rol,
    type_rol: instructor.type_rol
  }
}

async function fetchSubscriptionStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessUserId: string,
  organizationId: string | undefined,
  courseId: string
): Promise<BusinessCourseSubscriptionStatus> {
  let hasSubscription = false
  let isOrganizationPurchased = false
  let canAssign = false
  let canPurchaseForFree = false
  let monthlyCourseCount = 0
  let maxCoursesPerPeriod = 10

  if (!organizationId) {
    return {
      has_subscription: false,
      is_purchased: false,
      is_organization_purchased: false,
      can_assign: false,
      can_purchase_for_free: false,
      monthly_course_count: 0,
      max_courses_per_period: maxCoursesPerPeriod
    }
  }

  try {
    hasSubscription = await SubscriptionService.hasActiveSubscription(businessUserId, organizationId)
  } catch (error) {
    logger.warn('Error checking subscription for business course detail', { error, businessUserId, organizationId })
  }

  try {
    const { data: orgPurchase } = await supabase
      .from('organization_course_purchases')
      .select('purchase_id')
      .eq('organization_id', organizationId)
      .eq('course_id', courseId)
      .eq('access_status', 'active')
      .maybeSingle()

    isOrganizationPurchased = Boolean(orgPurchase)

    if (!isOrganizationPurchased && hasSubscription) {
      const limitCheck = await SubscriptionService.canOrganizationPurchaseCourse(organizationId, 10)
      canPurchaseForFree = limitCheck.canPurchase
      monthlyCourseCount = limitCheck.currentCount
      maxCoursesPerPeriod = limitCheck.maxCourses
    }

    canAssign = hasSubscription && isOrganizationPurchased
  } catch (error) {
    logger.warn('Error checking organization purchase for business course detail', { error, organizationId, courseId })
  }

  return {
    has_subscription: hasSubscription,
    is_purchased: isOrganizationPurchased,
    is_organization_purchased: isOrganizationPurchased,
    can_assign: canAssign,
    can_purchase_for_free: canPurchaseForFree,
    monthly_course_count: monthlyCourseCount,
    max_courses_per_period: maxCoursesPerPeriod
  }
}

export class BusinessCourseDetailServerService {
  static async getCourseDetail({
    courseId,
    businessUserId,
    organizationId
  }: BusinessCourseDetailOptions): Promise<BusinessCourseDetail | null> {
    const supabase = await createClient()

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        category,
        level,
        instructor_id,
        duration_total_minutes,
        thumbnail_url,
        slug,
        price,
        average_rating,
        student_count,
        review_count,
        learning_objectives,
        created_at,
        updated_at
      `)
      .eq('id', courseId)
      .single<CourseRow>()

    if (courseError) {
      throw courseError
    }

    if (!course) {
      return null
    }

    const [modules, reviews, subscriptionStatus] = await Promise.all([
      supabase
        .from('course_modules')
        .select(`
          module_id,
          module_title,
          module_description,
          module_order_index,
          module_duration_minutes,
          is_required
        `)
        .eq('course_id', course.id)
        .eq('is_published', true)
        .order('module_order_index', { ascending: true })
        .then(result => result.data as CourseModuleRow[] || []),
      supabase
        .from('course_reviews')
        .select(`
          review_id,
          review_title,
          review_content,
          rating,
          is_verified,
          created_at,
          users!inner (display_name, first_name, last_name, username, profile_picture_url)
        `)
        .eq('course_id', course.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(10)
        .then(result => result.data as CourseReviewRow[] || []),
      fetchSubscriptionStatus(supabase, businessUserId, organizationId, course.id)
    ])

    const moduleIds = modules.map(module => module.module_id)
    const lessons = moduleIds.length
      ? ((await supabase
          .from('course_lessons')
          .select(`
            lesson_id,
            module_id,
            lesson_title,
            lesson_description,
            lesson_order_index,
            duration_seconds,
            total_duration_minutes,
            video_provider,
            video_provider_id,
            instructor_id
          `)
          .in('module_id', moduleIds)
          .eq('is_published', true)
          .order('lesson_order_index', { ascending: true })).data as CourseLessonRow[] || [])
      : []

    const lessonIds = lessons.map(lesson => lesson.lesson_id)
    const [materials, activities] = lessonIds.length
      ? await Promise.all([
          supabase
            .from('lesson_materials')
            .select('lesson_id, estimated_time_minutes')
            .in('lesson_id', lessonIds)
            .then(result => result.data as CourseSupplementRow[] || []),
          supabase
            .from('lesson_activities')
            .select('lesson_id, estimated_time_minutes')
            .in('lesson_id', lessonIds)
            .then(result => result.data as CourseSupplementRow[] || [])
        ])
      : [[], []]

    const modulesWithLessons = buildBusinessCourseModules(modules, lessons, materials, activities)
    const instructorId = resolveBusinessCourseInstructorId(course.instructor_id, modulesWithLessons)

    const instructor = instructorId
      ? mapInstructor(
          ((await supabase
            .from('users')
            .select('id, first_name, last_name, display_name, username, email, profile_picture_url, bio, linkedin_url, github_url, website_url, location, cargo_rol, type_rol')
            .eq('id', instructorId)
            .single()).data as InstructorRow | null) || null
        )
      : null

    const totalModules = modulesWithLessons.length
    const totalLessons = modulesWithLessons.reduce((sum, module) => sum + module.lessons.length, 0)
    const totalDuration = modulesWithLessons.reduce((sum, module) => sum + module.calculated_duration_minutes, 0)

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      instructor,
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
      stats: {
        total_modules: totalModules,
        total_lessons: totalLessons,
        total_duration_minutes: totalDuration
      },
      modules: modulesWithLessons,
      reviews: mapBusinessCourseReviews(reviews),
      subscription_status: subscriptionStatus
    }
  }
}
