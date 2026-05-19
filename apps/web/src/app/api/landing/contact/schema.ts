import { z } from 'zod'

export const landingContactSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().max(320),
  company: z.string().min(1).max(200),
  source: z.string().max(120).optional(),
  timestamp: z.string().datetime().optional(),
})

export type LandingContactBody = z.infer<typeof landingContactSchema>
