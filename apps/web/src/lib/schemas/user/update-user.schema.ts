import { z } from 'zod'
import {
  DateOfBirthSchema,
  UserGenderSchema,
} from '../user-demographics.schema'
import {
  UserBioSchema,
  UserEmailSchema,
  UserNameSchema,
  UserProfilePictureUrlSchema,
  UserRoleEnumSchema,
} from './base-fields.schema'

export const UpdateUserSchema = z.object({
  email: UserEmailSchema.optional(),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  display_name: z.string().optional().nullable(),
  username: UserNameSchema.optional(),
  cargo_rol: UserRoleEnumSchema.optional(),
  phone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  country_code: z.string().optional().nullable(),
  date_of_birth: DateOfBirthSchema.optional(),
  gender: UserGenderSchema.optional(),
  email_verified: z.boolean().optional(),
  bio: UserBioSchema,
  profile_picture_url: UserProfilePictureUrlSchema,
  is_active: z.boolean().optional(),
  // Suspensión de cuenta (solo la usa el panel del superadmin; banned_at se
  // estampa server-side en buildAdminUserUpdatePayload, nunca lo envía el cliente).
  is_banned: z.boolean().optional(),
  ban_reason: z.string().trim().max(500).optional().nullable(),
})

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
