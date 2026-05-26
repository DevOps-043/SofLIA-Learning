import { z } from 'zod'

export const landingContactSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().max(320),
  company: z.string().min(1).max(200),
  phone: z.string().max(80).optional(),
  companySize: z.string().max(80).optional(),
  interest: z.string().max(120).optional(),
  message: z.string().max(1200).optional(),
  source: z.string().max(120).optional(),
  timestamp: z.string().datetime().optional(),
})

export type LandingContactBody = z.infer<typeof landingContactSchema>
