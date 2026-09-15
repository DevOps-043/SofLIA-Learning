import { logger } from '../../../lib/logger'
import type { BusinessCourseSubscriptionStatus } from '../types/business-course-detail.types'
import { SubscriptionService } from './subscription.service'
import { buildSubscriptionStatus } from './business-course-subscription-status.mapper'

export async function fetchSubscriptionStatus(
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
  organizationId: string,
  courseId: string,
  hasSubscription: boolean,
) {
  let maxCoursesPerPeriod = 10
  let monthlyCourseCount = 0
  let canPurchaseForFree = false

  try {
    // organization_course_purchases nunca tuvo policies de RLS para
    // `authenticated`; el barrido deny-by-default de la migracion
    // 20260827120000_emergency_data_api_lockdown la dejo sin grants. La
    // ruta que invoca este servicio ya autorizo al llamante via
    // requireBusiness(), asi que se usa el cliente de service role.
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()
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
