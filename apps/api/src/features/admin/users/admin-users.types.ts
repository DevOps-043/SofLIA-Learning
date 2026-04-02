import { z } from 'zod'

import { nonEmptyStringSchema } from '@/core/validation/common.schemas'

function emptyStringToUndefined(value: unknown) {
  return typeof value === 'string' && value.trim().length === 0
    ? undefined
    : value
}

function emptyStringToNull(value: unknown) {
  return typeof value === 'string' && value.trim().length === 0 ? null : value
}

const optionalQueryStringSchema = z.preprocess(
  emptyStringToUndefined,
  z.string().trim().min(1).max(120).optional(),
)

const optionalNullableStringSchema = (maxLength: number) =>
  z.preprocess(
    emptyStringToNull,
    z.string().trim().max(maxLength).nullable().optional(),
  )

const optionalNullableUrlSchema = z.preprocess(
  emptyStringToNull,
  z.string().trim().url().nullable().optional(),
)

const optionalEmailSchema = z.preprocess(
  emptyStringToUndefined,
  z.string().trim().max(255).email().optional(),
)

export const adminUserStatusSchema = z.enum(['active', 'inactive', 'banned'])

export const adminUserIdParamsSchema = z.object({
  userId: nonEmptyStringSchema,
})

export const adminUserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: optionalQueryStringSchema,
  role: optionalQueryStringSchema,
  status: adminUserStatusSchema.optional(),
})

export const adminUserUpdateBodySchema = z
  .object({
    username: z.string().trim().min(1).max(80).optional(),
    email: optionalEmailSchema,
    first_name: optionalNullableStringSchema(120),
    last_name: optionalNullableStringSchema(120),
    display_name: optionalNullableStringSchema(160),
    email_verified: z.boolean().optional(),
    phone: optionalNullableStringSchema(40),
    bio: optionalNullableStringSchema(1000),
    location: optionalNullableStringSchema(160),
    profile_picture_url: optionalNullableUrlSchema,
    country_code: optionalNullableStringSchema(8),
    type_rol: optionalNullableStringSchema(120),
  })
  .refine(
    (body) => Object.values(body).some((value) => value !== undefined),
    'Se requiere al menos un campo para actualizar',
  )

export const adminUserRoleBodySchema = z.object({
  role: nonEmptyStringSchema.max(80),
  type_rol: optionalNullableStringSchema(120),
})

export type AdminUserStatusFilter = z.infer<typeof adminUserStatusSchema>
export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateBodySchema>
export type AdminUserRoleUpdateInput = z.infer<typeof adminUserRoleBodySchema>

export interface AdminUser {
  id: string
  username: string | null
  email: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  cargo_rol: string | null
  type_rol: string | null
  email_verified: boolean
  email_verified_at: string | null
  phone: string | null
  bio: string | null
  location: string | null
  profile_picture_url: string | null
  country_code: string | null
  created_at: string | null
  updated_at: string | null
  last_login_at: string | null
  is_banned: boolean
  banned_at: string | null
  ban_reason: string | null
}

export interface AdminUserMembership {
  organization_id: string
  organization_name: string | null
  organization_slug: string | null
  role: string | null
  status: string | null
}

export interface AdminUserListItem extends AdminUser {
  organization_name: string | null
  organization_slug: string | null
  organization_role: string | null
  membership_status: string | null
}

export interface AdminUserDetail extends AdminUser {
  memberships: AdminUserMembership[]
}

export interface AdminUserListResult {
  users: AdminUserListItem[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface AdminUsersRoleDistribution {
  role: string
  count: number
}

export interface AdminUsersOrganizationDistribution {
  organization_id: string
  organization_name: string
  organization_slug: string | null
  count: number
}

export interface AdminUserStats {
  total_users: number
  active_users: number
  banned_users: number
  verified_users: number
  role_distribution: AdminUsersRoleDistribution[]
  organization_distribution: AdminUsersOrganizationDistribution[]
}

export interface AdminUserSoftDeleteResult {
  user_id: string
  banned_at: string
  reason: string
}

export interface NormalizedAdminUserListQuery {
  page: number
  limit: number
  from: number
  to: number
  search?: string
  role?: string
  status?: AdminUserStatusFilter
  activeSinceIso: string
}
