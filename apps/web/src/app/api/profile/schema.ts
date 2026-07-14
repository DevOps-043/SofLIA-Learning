import { z } from 'zod'

import {
  DateOfBirthSchema,
  UserGenderSchema,
} from '@/lib/schemas/user-demographics.schema'

export const updateProfileSchema = z
  .object({
    username: z
      .string()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_-]+$/)
      .optional(),
    first_name: z.string().max(100).optional().nullable(),
    last_name: z.string().max(100).optional().nullable(),
    display_name: z.string().max(100).optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    bio: z.string().max(500).optional().nullable(),
    location: z.string().max(100).optional().nullable(),
    platform_role: z.string().max(200).optional().nullable(),
    job_title: z.string().max(100).optional().nullable(),
    job_description: z.string().max(1_000).optional().nullable(),
    profile_picture_url: z
      .union([z.string().url().max(500), z.literal('')])
      .optional()
      .nullable(),
    country_code: z.string().max(10).optional().nullable(),
    date_of_birth: DateOfBirthSchema.optional(),
    gender: UserGenderSchema.optional(),
  })
  .strict()

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>
