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

export const subscriptionUpdateSchema = z.object({
  planId: planIdSchema.optional(),
  billingCycle: billingCycleSchema.optional(),
})

export type SubscriptionUpdateBody = z.infer<typeof subscriptionUpdateSchema>
