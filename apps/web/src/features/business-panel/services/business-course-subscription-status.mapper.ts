import type { BusinessCourseSubscriptionStatus } from '../types/business-course-detail.types'

export function buildSubscriptionStatus(
  hasSubscription: boolean,
  isOrganizationPurchased: boolean,
  canAssign: boolean,
  canPurchaseForFree: boolean,
  monthlyCourseCount: number,
  maxCoursesPerPeriod: number,
): BusinessCourseSubscriptionStatus {
  return {
    has_subscription: hasSubscription,
    is_purchased: isOrganizationPurchased,
    is_organization_purchased: isOrganizationPurchased,
    can_assign: canAssign,
    can_purchase_for_free: canPurchaseForFree,
    monthly_course_count: monthlyCourseCount,
    max_courses_per_period: maxCoursesPerPeriod,
  }
}
