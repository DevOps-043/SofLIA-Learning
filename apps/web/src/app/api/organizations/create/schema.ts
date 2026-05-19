import { z } from 'zod'

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(200),
  contact_email: z.string().email().max(320),
  contact_phone: z.string().max(40).optional().nullable(),
  description: z.string().max(2_000).optional().nullable(),
  website_url: z.string().url().max(2_000).optional().nullable(),
})

export type CreateOrganizationBody = z.infer<typeof createOrganizationSchema>
