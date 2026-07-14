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

export const CreateUserSchema = z.object({
  email: UserEmailSchema,
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  display_name: z.string().optional().nullable(),
  username: UserNameSchema,
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres'),
  cargo_rol: UserRoleEnumSchema.default('Usuario'),
  phone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  country_code: z.string().optional().nullable(),
  date_of_birth: DateOfBirthSchema.optional(),
  gender: UserGenderSchema.optional(),
  bio: UserBioSchema,
  profile_picture_url: UserProfilePictureUrlSchema,
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>
