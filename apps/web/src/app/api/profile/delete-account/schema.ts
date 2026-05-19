import { z } from 'zod'

export const deleteAccountSchema = z
  .object({
    confirmation: z.string().min(1).max(255),
    reason: z.string().max(500).optional(),
  })
  .strict()

export type DeleteAccountBody = z.infer<typeof deleteAccountSchema>
