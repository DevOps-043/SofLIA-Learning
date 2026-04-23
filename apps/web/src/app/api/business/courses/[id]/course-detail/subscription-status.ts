import { SessionService } from '@/features/auth/services/session.service'
import { SubscriptionService } from '@/features/business-panel/services/subscription.service'
import { logger } from '@/lib/utils/logger'
import type { CourseRow, SupabaseServerClient } from './types'

const DEFAULT_MAX_COURSES_PER_PERIOD = 10

export async function resolveSubscriptionStatus(
  supabase: SupabaseServerClient,
  organizationId: string | null | undefined,
  course: CourseRow,
) {
  let hasSubscription = false
  let isOrganizationPurchased = false
  let canPurchaseForFree = false
  let monthlyCourseCount = 0
  let maxCoursesPerPeriod = DEFAULT_MAX_COURSES_PER_PERIOD

  try {
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser || !organizationId) {
      return buildStatus(false, false, false, 0, maxCoursesPerPeriod)
    }

    try {
      hasSubscription = await SubscriptionService.hasActiveSubscription(
        currentUser.id,
        organizationId,
      )
    } catch (error) {
      logger.warn('Error checking subscription (non-critical):', error)
    }

    const { data: organizationPurchase } = await supabase
      .from('organization_course_purchases')
      .select('purchase_id')
      .eq('organization_id', organizationId)
      .eq('course_id', course.id)
      .eq('access_status', 'active')
      .maybeSingle()

    isOrganizationPurchased = !!organizationPurchase
    if (!isOrganizationPurchased && hasSubscription) {
      const limitCheck = await SubscriptionService.canOrganizationPurchaseCourse(
        organizationId,
        DEFAULT_MAX_COURSES_PER_PERIOD,
      )
      canPurchaseForFree = limitCheck.canPurchase
      monthlyCourseCount = limitCheck.currentCount
      maxCoursesPerPeriod = limitCheck.maxCourses
    }
  } catch (error) {
    logger.warn('Error resolving subscription status (non-critical):', error)
  }

  return buildStatus(
    hasSubscription,
    isOrganizationPurchased,
    canPurchaseForFree,
    monthlyCourseCount,
    maxCoursesPerPeriod,
  )
}

function buildStatus(
  hasSubscription: boolean,
  isOrganizationPurchased: boolean,
  canPurchaseForFree: boolean,
  monthlyCourseCount: number,
  maxCoursesPerPeriod: number,
) {
  return {
    has_subscription: hasSubscription,
    is_purchased: isOrganizationPurchased,
    is_organization_purchased: isOrganizationPurchased,
    can_assign: hasSubscription && isOrganizationPurchased,
    can_purchase_for_free: canPurchaseForFree,
    monthly_course_count: monthlyCourseCount,
    max_courses_per_period: maxCoursesPerPeriod,
  }
}
