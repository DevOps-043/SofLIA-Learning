import type { FeatureKey, SubscriptionPlan } from './types'

const allPlans = ['team', 'business', 'enterprise'] as const
const businessAndEnterprise = ['business', 'enterprise'] as const
const enterpriseOnly = ['enterprise'] as const

export const VALID_SUBSCRIPTION_PLANS = allPlans

export const FEATURE_PLAN_ACCESS: Record<
  FeatureKey,
  readonly SubscriptionPlan[]
> = {
  panel_admin: allPlans,
  course_messaging: businessAndEnterprise,
  custom_groups: businessAndEnterprise,
  advanced_groups: enterpriseOnly,
  corporate_branding: enterpriseOnly,
  basic_reports: allPlans,
  advanced_analytics: businessAndEnterprise,
  skills_info: businessAndEnterprise,
  course_analysis: businessAndEnterprise,
  custom_dashboard: enterpriseOnly,
  data_export: enterpriseOnly,
  full_catalog: allPlans,
  unlimited_certifications: businessAndEnterprise,
  custom_certificates: enterpriseOnly,
  mobile_app: allPlans,
  offline_learning: businessAndEnterprise,
  live_courses: enterpriseOnly,
  automatic_notifications: allPlans,
  smart_reminders: businessAndEnterprise,
  external_integrations: businessAndEnterprise,
  enterprise_sso: businessAndEnterprise,
  calendar_integration: businessAndEnterprise,
  data_api: enterpriseOnly,
  email_support: allPlans,
  priority_support: businessAndEnterprise,
  dedicated_247_support: enterpriseOnly,
  customer_success_manager: enterpriseOnly,
  custom_onboarding: enterpriseOnly,
  strategic_consulting: enterpriseOnly,
  notification_email: allPlans,
  notification_push: businessAndEnterprise,
  notification_sms: enterpriseOnly,
  notification_whatsapp: businessAndEnterprise,
}
