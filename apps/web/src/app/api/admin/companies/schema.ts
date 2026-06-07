import { z } from 'zod'
import { resolveBrandHexColor } from '@/features/admin/services/admin-companies/admin-company-brand-colors'

const optionalNullableString = (max: number) =>
  z.union([z.string().max(max), z.null()]).optional()

const optionalUrl = z.union([z.string().url().max(2_000), z.literal(''), z.null()]).optional()
const optionalHexColor = z.preprocess(
  (value) => {
    if (value === undefined) return undefined
    if (value === null) return null
    if (typeof value !== 'string') return value

    if (!value.trim()) return null
    const normalizedColor = resolveBrandHexColor(value)
    return normalizedColor ?? value.trim()
  },
  z
    .union([z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/), z.null()])
    .optional(),
)

export const createCompanySchema = z.object({
  name: z.string().min(1).max(200),
  slug: optionalNullableString(160),
  description: optionalNullableString(2_000),
  contact_email: z
    .union([z.string().email().max(320), z.literal(''), z.null()])
    .optional(),
  contact_phone: optionalNullableString(40),
  website_url: optionalUrl,
  subscription_plan: optionalNullableString(80),
  subscription_status: optionalNullableString(80),
  max_users: z.number().int().min(1).max(1_000_000).optional(),
  is_active: z.boolean().optional(),
  brand_logo_url: optionalUrl,
  brand_banner_url: optionalUrl,
  brand_favicon_url: optionalUrl,
  brand_color_primary: optionalHexColor,
  brand_color_secondary: optionalHexColor,
  brand_color_accent: optionalHexColor,
  brand_font_family: optionalNullableString(120),
  google_login_enabled: z.boolean().optional(),
  microsoft_login_enabled: z.boolean().optional(),
  owner_email: z.string().email().max(320).optional(),
  owner_position: optionalNullableString(200),
})

export type CreateCompanyBody = z.infer<typeof createCompanySchema>

export const updateCompanySchema = createCompanySchema
  .extend({
    logo_url: optionalUrl,
  })
  .partial()

export type UpdateCompanyBody = z.infer<typeof updateCompanySchema>

export const updateMemberRoleSchema = z.object({
  role: z.enum(['member', 'admin', 'owner']),
})

export type UpdateMemberRoleBody = z.infer<typeof updateMemberRoleSchema>
