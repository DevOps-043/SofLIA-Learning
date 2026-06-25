import {
  FEATURE_PLAN_ACCESS,
  VALID_SUBSCRIPTION_PLANS,
} from './subscriptionFeatures/access'
import { FEATURE_NAMES, PLAN_NAMES } from './subscriptionFeatures/labels'
import type { FeatureKey, SubscriptionPlan } from './subscriptionFeatures/types'

export type { FeatureKey, SubscriptionPlan } from './subscriptionFeatures/types'

function normalizePlan(plan: SubscriptionPlan | string): SubscriptionPlan | null {
  const normalizedPlan = plan.toLowerCase() as SubscriptionPlan
  return VALID_SUBSCRIPTION_PLANS.includes(normalizedPlan) ? normalizedPlan : null
}

export function hasFeature(
  plan: SubscriptionPlan | string | null | undefined,
  feature: FeatureKey,
): boolean {
  if (!plan) return false

  const normalizedPlan = normalizePlan(plan)
  if (!normalizedPlan) return false

  return FEATURE_PLAN_ACCESS[feature]?.includes(normalizedPlan) ?? false
}

export function getRequiredPlan(feature: FeatureKey): SubscriptionPlan | null {
  return FEATURE_PLAN_ACCESS[feature]?.[0] ?? null
}

export function getFeatureName(feature: FeatureKey): string {
  return FEATURE_NAMES[feature] || feature
}

export function getPlanName(plan: SubscriptionPlan | string): string {
  const normalizedPlan = normalizePlan(plan)
  return normalizedPlan ? PLAN_NAMES[normalizedPlan] : plan
}

export function getFeatureMessage(
  feature: FeatureKey,
  currentPlan: SubscriptionPlan | string | null | undefined,
): string {
  const requiredPlan = getRequiredPlan(feature)

  if (!requiredPlan) {
    return `La característica "${getFeatureName(feature)}" no está disponible en ningún plan.`
  }

  const currentPlanName = currentPlan ? getPlanName(currentPlan) : 'tu plan actual'
  const requiredPlanName = getPlanName(requiredPlan)

  if (hasFeature(currentPlan, feature)) {
    return `La característica "${getFeatureName(feature)}" está disponible en ${currentPlanName}.`
  }

  return `La característica "${getFeatureName(feature)}" solo está disponible en ${requiredPlanName}. Actualiza tu plan para acceder a esta funcionalidad.`
}

export function getPlansWithFeature(feature: FeatureKey): SubscriptionPlan[] {
  return [...(FEATURE_PLAN_ACCESS[feature] ?? [])]
}

export function getFeaturesForPlan(
  plan: SubscriptionPlan | string | null | undefined,
): FeatureKey[] {
  if (!plan) return []

  const normalizedPlan = normalizePlan(plan)
  if (!normalizedPlan) return []

  return Object.keys(FEATURE_PLAN_ACCESS).filter((feature) =>
    hasFeature(normalizedPlan, feature as FeatureKey),
  ) as FeatureKey[]
}

export function getAllowedNotificationChannels(
  plan: SubscriptionPlan | string | null | undefined,
): string[] {
  const channels: string[] = []

  if (hasFeature(plan, 'notification_email')) channels.push('email')
  if (hasFeature(plan, 'notification_push')) channels.push('push')
  if (hasFeature(plan, 'notification_sms')) channels.push('sms')
  if (hasFeature(plan, 'notification_whatsapp')) channels.push('whatsapp')

  return channels
}
