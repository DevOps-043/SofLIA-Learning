import { logger } from '../../../lib/logger'
import type { BusinessCourseSubscriptionStatus } from '../types/business-course-detail.types'
import { SubscriptionService } from './subscription.service'
import type { BusinessCourseDetailSupabaseClient } from './business-course-detail.server.types'
import { buildSubscriptionStatus } from './business-course-subscription-status.mapper'

export async function fetchSubscriptionStatus(
  supabase: BusinessCourseDetailSupabaseClient,
  businessUserId: string,
  organizationId: string | undefined,
  courseId: string,
): Promise<BusinessCourseSubscriptionStatus> {
  const emptyStatus = buildSubscriptionStatus(false, false, false, false, 0, 10)
  if (!organizationId) return emptyStatus

  const hasSubscription = await hasActiveBusinessSubscription(
    businessUserId,
    organizationId,
  )
  const purchaseStatus = await getOrganizationCoursePurchaseStatus(
    supabase,
    organizationId,
    courseId,
    hasSubscription,
  )

  return buildSubscriptionStatus(
    hasSubscription,
    purchaseStatus.isOrganizationPurchased,
    hasSubscription && purchaseStatus.isOrganizationPurchased,
    purchaseStatus.canPurchaseForFree,
    purchaseStatus.monthlyCourseCount,
    purchaseStatus.maxCoursesPerPeriod,
  )
}

async function hasActiveBusinessSubscription(
  businessUserId: string,
  organizationId: string,
) {
  try {
    return await SubscriptionService.hasActiveSubscription(businessUserId, organizationId)
  } catch (error) {
    logger.warn('Error checking subscription for business course detail', {
      error,
      businessUserId,
      organizationId,
    })
    return false
  }
}

async function getOrganizationCoursePurchaseStatus(
  supabase: BusinessCourseDetailSupabaseClient,
  organizationId: string,
  courseId: string,
  hasSubscription: boolean,
) {
  let maxCoursesPerPeriod = 10
  let monthlyCourseCount = 0
  let canPurchaseForFree = false

  try {
    const { data: orgPurchase } = await supabase
      .from('organization_course_purchases')
      .select('purchase_id')
      .eq('organization_id', organizationId)
      .eq('course_id', courseId)
      .eq('access_status', 'active')
      .maybeSingle()

    const isOrganizationPurchased = Boolean(orgPurchase)
    if (!isOrganizationPurchased && hasSubscription) {
      const limitCheck = await SubscriptionService.canOrganizationPurchaseCourse(organizationId, 10)
      canPurchaseForFree = limitCheck.canPurchase
      monthlyCourseCount = limitCheck.currentCount
      maxCoursesPerPeriod = limitCheck.maxCourses
    }

    return { isOrganizationPurchased, canPurchaseForFree, monthlyCourseCount, maxCoursesPerPeriod }
  } catch (error) {
    logger.warn('Error checking organization purchase for business course detail', {
      error,
      organizationId,
      courseId,
    })
    return { isOrganizationPurchased: false, canPurchaseForFree, monthlyCourseCount, maxCoursesPerPeriod }
  }
}
