import { z } from 'zod'

const planIdSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.enum(['team', 'business', 'enterprise']))

const billingCycleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.enum(['monthly', 'yearly']))

export const changePlanSchema = z.object({
  planId: planIdSchema,
  billingCycle: billingCycleSchema,
})

export type ChangePlanBody = z.infer<typeof changePlanSchema>
