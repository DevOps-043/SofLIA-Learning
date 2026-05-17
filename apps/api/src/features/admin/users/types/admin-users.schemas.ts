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
