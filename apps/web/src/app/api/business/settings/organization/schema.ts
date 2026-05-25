import { z } from 'zod'

export const organizationUpdateSchema = z.object({
  name: z.string().max(200).optional(),
  description: z.string().max(2_000).nullable().optional(),
  contact_email: z.string().max(320).nullable().optional(),
  contact_phone: z.string().max(80).nullable().optional(),
  website_url: z.string().max(2_000).nullable().optional(),
  logo_url: z.string().max(2_000).nullable().optional(),
  slug: z.string().max(80).nullable().optional(),
  max_users: z.union([z.string().max(20), z.number().int()]).optional(),
  google_login_enabled: z.boolean().optional(),
  microsoft_login_enabled: z.boolean().optional(),
})

export type OrganizationUpdateBody = z.infer<typeof organizationUpdateSchema>
