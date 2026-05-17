import { SUBSCRIPTION_PLANS } from './feature-map'
import type { SubscriptionPlan } from './types'

export function normalizeSubscriptionPlan(
  plan: SubscriptionPlan | string | null | undefined
): SubscriptionPlan | null {
  if (!plan) return null

  const normalizedPlan = plan.toLowerCase() as SubscriptionPlan
  return SUBSCRIPTION_PLANS.includes(normalizedPlan) ? normalizedPlan : null
}
