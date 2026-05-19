import { z } from 'zod'

import {
  DateOfBirthSchema,
  UserGenderSchema,
} from '@/lib/schemas/user-demographics.schema'

export const createBusinessUserSchema = z.object({
  username: z.string().min(3).max(60).optional(),
  email: z.string().email().max(320),
  password: z.string().min(8).max(200).optional(),
  first_name: z.string().min(1).max(120),
  last_name: z.string().min(1).max(120),
  display_name: z.string().max(180).optional().nullable(),
  date_of_birth: DateOfBirthSchema.optional().nullable(),
  gender: UserGenderSchema.optional().nullable(),
  job_title: z.string().max(200).optional().nullable(),
  org_role: z.enum(['member', 'admin', 'owner']).optional().default('member'),
  send_invitation: z.boolean().optional(),
})

export type CreateBusinessUserBody = z.infer<typeof createBusinessUserSchema>

export const updateBusinessUserSchema = z
  .object({
    first_name: z.string().min(1).max(120).optional(),
    last_name: z.string().min(1).max(120).optional(),
    display_name: z.string().max(180).optional().nullable(),
    email: z.string().email().max(320).optional(),
    phone: z.string().max(40).optional().nullable(),
    job_title: z.string().max(200).optional().nullable(),
    role: z.enum(['member', 'admin', 'owner']).optional(),
    status: z.enum(['active', 'pending', 'suspended']).optional(),
    date_of_birth: DateOfBirthSchema.optional().nullable(),
    gender: UserGenderSchema.optional().nullable(),
  })
  .strict()

export type UpdateBusinessUserBody = z.infer<typeof updateBusinessUserSchema>
