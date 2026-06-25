import type { FeatureAccess, FeatureKey, SubscriptionPlan } from './types'

const allPlans: FeatureAccess = { team: true, business: true, enterprise: true }
const businessPlus: FeatureAccess = { team: false, business: true, enterprise: true }
const enterpriseOnly: FeatureAccess = {
  team: false,
  business: false,
  enterprise: true,
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  'team',
  'business',
  'enterprise',
]

export const FEATURE_MAP = {
  panel_admin: allPlans,
  course_messaging: businessPlus,
  custom_groups: businessPlus,
  advanced_groups: enterpriseOnly,
  corporate_branding: enterpriseOnly,
  basic_reports: allPlans,
  advanced_analytics: businessPlus,
  skills_info: businessPlus,
  course_analysis: businessPlus,
  custom_dashboard: enterpriseOnly,
  data_export: enterpriseOnly,
  full_catalog: allPlans,
  unlimited_certifications: businessPlus,
  custom_certificates: enterpriseOnly,
  mobile_app: allPlans,
  offline_learning: businessPlus,
  live_courses: enterpriseOnly,
  automatic_notifications: allPlans,
  smart_reminders: businessPlus,
  external_integrations: businessPlus,
  enterprise_sso: businessPlus,
  calendar_integration: businessPlus,
  data_api: enterpriseOnly,
  email_support: allPlans,
  priority_support: businessPlus,
  dedicated_247_support: enterpriseOnly,
  customer_success_manager: enterpriseOnly,
  custom_onboarding: enterpriseOnly,
  strategic_consulting: enterpriseOnly,
  notification_email: allPlans,
  notification_push: businessPlus,
  notification_sms: enterpriseOnly,
  notification_whatsapp: businessPlus,
} satisfies Record<FeatureKey, FeatureAccess>
