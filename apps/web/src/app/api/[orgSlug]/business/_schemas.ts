import { z } from 'zod'

import { STREAMABLE_VIDEO_MIME_TYPES } from '@/lib/media/video-upload-policy'
import { UserDemographicsSchema } from '@/lib/schemas/user-demographics.schema'

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)

const optionalTextSchema = (maxLength: number) =>
  z.string().trim().max(maxLength).nullable().optional()

const requiredTextSchema = (maxLength: number) =>
  z.string().trim().min(1).max(maxLength)

const optionalJsonObjectSchema = z.record(z.unknown()).optional()

const planIdSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.enum(['team', 'business', 'enterprise']))

const billingCycleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.enum(['monthly', 'yearly']))

const maxUsersSchema = z.union([
  z.string().trim().min(1).max(16),
  z.number().int().positive(),
])

const organizationRoleSchema = z.enum(['owner', 'admin', 'member'])

const analyticsOptionalFilterSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .optional()

export const brandingUpdateSchema = z.object({
  logo_url: optionalTextSchema(2048),
  favicon_url: optionalTextSchema(2048),
  banner_url: optionalTextSchema(2048),
  color_primary: z.union([hexColorSchema, z.literal(''), z.null()]).optional(),
  color_secondary: z.union([hexColorSchema, z.literal(''), z.null()]).optional(),
  color_accent: z.union([hexColorSchema, z.literal(''), z.null()]).optional(),
  font_family: optionalTextSchema(120),
  branding_enabled: z.boolean().optional(),
}).passthrough()

export const certificateTemplateCreateSchema = z.object({
  name: requiredTextSchema(160),
  description: optionalTextSchema(1000),
  design_config: z.record(z.unknown()),
  is_default: z.boolean().optional(),
}).passthrough()

export const certificateTemplateUpdateSchema = z.object({
  name: requiredTextSchema(160).optional(),
  description: optionalTextSchema(1000),
  design_config: z.record(z.unknown()).optional(),
  is_default: z.boolean().optional(),
  is_active: z.boolean().optional(),
}).passthrough()

export const courseAssignmentDeleteSchema = z.object({
  user_ids: z.array(z.string().uuid()).min(1),
}).passthrough()

export const courseAssignmentCreateSchema = z.object({
  user_ids: z.array(z.string().uuid()).min(1),
  due_date: optionalTextSchema(80),
  start_date: optionalTextSchema(80),
  approach: z.enum(['fast', 'balanced', 'long', 'custom']).nullable().optional(),
  message: optionalTextSchema(2000),
}).passthrough()

export const dashboardLayoutSaveSchema = z.object({
  name: requiredTextSchema(160),
  layout_config: z.record(z.unknown()),
  is_default: z.boolean().optional(),
}).passthrough()

export const reportsAnalyticsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  granularity: z.enum(['day', 'month', 'year']).optional(),
  courseId: analyticsOptionalFilterSchema,
  gender: analyticsOptionalFilterSchema,
  ageBand: analyticsOptionalFilterSchema,
  jobTitle: analyticsOptionalFilterSchema,
  role: analyticsOptionalFilterSchema,
  status: analyticsOptionalFilterSchema,
  regionId: analyticsOptionalFilterSchema,
  zoneId: analyticsOptionalFilterSchema,
  teamId: analyticsOptionalFilterSchema,
})

export const reportsAnalyticsExportSchema = reportsAnalyticsQuerySchema.extend({
  format: z.enum(['csv_zip', 'xlsx', 'pdf']),
  locale: z.enum(['es', 'en', 'pt']).optional(),
})

export const reportsAnalyticsInsightsSchema = reportsAnalyticsQuerySchema.extend({
  locale: z.enum(['es', 'en', 'pt']).optional(),
  format: z.enum(['json', 'pdf']).optional(),
})

export const notificationSettingSchema = z.object({
  event_type: z.string().trim().min(1).max(120).optional(),
  enabled: z.boolean().optional(),
  channels: z.array(z.string().trim().min(1).max(80)).optional(),
  template: z.unknown().optional(),
}).passthrough()

export const notificationSettingsUpdateSchema = z.object({
  settings: z.array(notificationSettingSchema),
}).passthrough()

export const joinRequestReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
}).passthrough()

export const createBusinessUserSchema = z.object({
  username: requiredTextSchema(80),
  email: z.string().trim().email().toLowerCase().max(320),
  password: z.string().min(6).max(200).optional(),
  first_name: optionalTextSchema(120),
  last_name: optionalTextSchema(120),
  display_name: optionalTextSchema(180),
  date_of_birth: UserDemographicsSchema.shape.date_of_birth,
  gender: UserDemographicsSchema.shape.gender,
  job_title: requiredTextSchema(160),
  org_role: organizationRoleSchema.optional(),
  send_invitation: z.boolean().optional(),
}).passthrough()

export const updateBusinessUserSchema = z.object({
  first_name: z.string().trim().max(120).optional(),
  last_name: z.string().trim().max(120).optional(),
  display_name: z.string().trim().max(180).optional(),
  email: z.string().trim().email().toLowerCase().max(320).optional(),
  cargo_rol: z.string().trim().max(120).optional(),
  job_title: z.string().trim().max(160).optional(),
  org_role: organizationRoleSchema.optional(),
  org_status: z.enum(['active', 'invited', 'suspended', 'removed']).optional(),
  profile_picture_url: z.string().trim().max(2048).optional(),
  bio: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(180).optional(),
  phone: z.string().trim().max(80).optional(),
  date_of_birth: UserDemographicsSchema.shape.date_of_birth,
  gender: UserDemographicsSchema.shape.gender,
}).passthrough()

export const teamCreateSchema = z.object({
  name: requiredTextSchema(160),
  description: optionalTextSchema(1000),
  team_leader_id: z.string().uuid().nullable().optional(),
  course_id: z.string().uuid().nullable().optional(),
  member_ids: z.array(z.string().uuid()).optional(),
  metadata: optionalJsonObjectSchema,
  image_url: optionalTextSchema(2048),
}).passthrough()

export const organizationSettingsUpdateSchema = z.object({
  name: z.string().trim().max(180).optional(),
  description: optionalTextSchema(2000),
  contact_email: z.string().trim().email().toLowerCase().max(320).nullable().optional(),
  contact_phone: optionalTextSchema(80),
  website_url: optionalTextSchema(2048),
  logo_url: optionalTextSchema(2048),
  max_users: maxUsersSchema.optional(),
  slug: z.string().trim().max(80).nullable().optional(),
  google_login_enabled: z.boolean().optional(),
  microsoft_login_enabled: z.boolean().optional(),
  show_navbar_name: z.boolean().optional(),
  industry: optionalTextSchema(160),
  company_size: optionalTextSchema(80),
  company_type: optionalTextSchema(120),
  company_mission: optionalTextSchema(2000),
  company_country: optionalTextSchema(120),
}).passthrough()

export const organizationProfileUpdateSchema = z.object({
  name: z.string().trim().max(180).optional(),
  description: optionalTextSchema(2000),
  contact_email: z.string().trim().email().toLowerCase().max(320).nullable().optional(),
  contact_phone: optionalTextSchema(80),
  website_url: optionalTextSchema(2048),
  logo_url: optionalTextSchema(2048),
  max_users: maxUsersSchema.optional(),
  slug: z.string().trim().max(80).nullable().optional(),
  google_login_enabled: z.boolean().optional(),
  microsoft_login_enabled: z.boolean().optional(),
}).passthrough()

export const subscriptionUpdateSchema = z.object({
  planId: planIdSchema.optional(),
  billingCycle: billingCycleSchema.optional(),
}).passthrough()

export const changePlanSchema = z.object({
  planId: planIdSchema,
  billingCycle: billingCycleSchema,
}).passthrough()

export const themeStyleSchema = z.object({
  background_type: z.enum(['image', 'color', 'gradient']),
  background_value: requiredTextSchema(2048),
  primary_button_color: hexColorSchema,
  secondary_button_color: hexColorSchema,
  accent_color: hexColorSchema,
}).passthrough()

export const stylesUpdateSchema = z.object({
  panel: themeStyleSchema.optional(),
  userDashboard: themeStyleSchema.optional(),
  login: themeStyleSchema.optional(),
}).passthrough()

export const applyThemeSchema = z.object({
  themeId: requiredTextSchema(120),
}).passthrough()

export const userIdsSchema = z
  .array(z.string().uuid('UserId invalido'))
  .min(1, 'Selecciona al menos un usuario')

export const assignLearningPathSchema = z.object({
  learningPathId: z.string().uuid('LearningPathId invalido'),
  userIds: userIdsSchema.optional(),
  target: z.object({
    type: z.enum(['all', 'node']),
    nodeIds: z.array(z.string().uuid('NodeId invalido')).optional(),
    includeDescendants: z.boolean().optional(),
  }).optional(),
}).refine(
  (value) => (value.userIds && value.userIds.length > 0) || Boolean(value.target),
  'Selecciona al menos un usuario o una audiencia',
).refine(
  (value) => value.target?.type !== 'node' || Boolean(value.target.nodeIds?.length),
  'Selecciona al menos un nodo',
)

export const applyDefaultsSchema = z.object({
  ruleIds: z.array(z.string().uuid('RuleId invalido')).optional(),
}).passthrough()

export const createDefaultRuleSchema = z.object({
  learningPathId: z.string().uuid('LearningPathId invalido'),
  scopeType: z.enum(['organization', 'node']).default('organization'),
  nodeId: z.string().uuid('NodeId invalido').nullable().optional(),
  includeDescendants: z.boolean().optional(),
  applyNow: z.boolean().optional().default(true),
}).passthrough()

export const introVideoUploadUrlSchema = z.object({
  fileName: requiredTextSchema(255),
  contentType: z.enum(STREAMABLE_VIDEO_MIME_TYPES),
  fileSize: z.number().int().positive().optional(),
  folder: z.string().trim().max(120).optional(),
}).passthrough()

export const introVideoUrlSchema = z.object({
  videoUrl: z.string().trim().url('URL de video invalida').max(2048),
}).passthrough()

export type BrandingUpdateBody = z.infer<typeof brandingUpdateSchema>
export type CertificateTemplateCreateBody = z.infer<typeof certificateTemplateCreateSchema>
export type CertificateTemplateUpdateBody = z.infer<typeof certificateTemplateUpdateSchema>
export type CourseAssignmentDeleteBody = z.infer<typeof courseAssignmentDeleteSchema>
export type CourseAssignmentCreateBody = z.infer<typeof courseAssignmentCreateSchema>
export type DashboardLayoutSaveBody = z.infer<typeof dashboardLayoutSaveSchema>
export type ReportsAnalyticsQueryBody = z.infer<typeof reportsAnalyticsQuerySchema>
export type ReportsAnalyticsExportBody = z.infer<typeof reportsAnalyticsExportSchema>
export type ReportsAnalyticsInsightsBody = z.infer<typeof reportsAnalyticsInsightsSchema>
export type NotificationSettingsUpdateBody = z.infer<typeof notificationSettingsUpdateSchema>
export type JoinRequestReviewBody = z.infer<typeof joinRequestReviewSchema>
export type CreateBusinessUserBody = z.infer<typeof createBusinessUserSchema>
export type UpdateBusinessUserBody = z.infer<typeof updateBusinessUserSchema>
export type TeamCreateBody = z.infer<typeof teamCreateSchema>
export type OrganizationSettingsUpdateBody = z.infer<typeof organizationSettingsUpdateSchema>
export type OrganizationProfileUpdateBody = z.infer<typeof organizationProfileUpdateSchema>
export type SubscriptionUpdateBody = z.infer<typeof subscriptionUpdateSchema>
export type ChangePlanBody = z.infer<typeof changePlanSchema>
export type StylesUpdateBody = z.infer<typeof stylesUpdateSchema>
export type ApplyThemeBody = z.infer<typeof applyThemeSchema>
export type AssignLearningPathBody = z.infer<typeof assignLearningPathSchema>
export type ApplyDefaultsBody = z.infer<typeof applyDefaultsSchema>
export type CreateDefaultRuleBody = z.infer<typeof createDefaultRuleSchema>
export type IntroVideoUploadUrlBody = z.infer<typeof introVideoUploadUrlSchema>
export type IntroVideoUrlBody = z.infer<typeof introVideoUrlSchema>
