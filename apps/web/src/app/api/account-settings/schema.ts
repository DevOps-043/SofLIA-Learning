import { z } from 'zod'

export const accountSettingsSchema = z.object({
  privacy: z
    .object({
      profileVisibility: z.enum(['public', 'private', 'friends']).optional(),
      showEmail: z.boolean().optional(),
      showActivity: z.boolean().optional(),
    })
    .optional(),
  notifications: z
    .object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      marketing: z.boolean().optional(),
      courseUpdates: z.boolean().optional(),
      communityUpdates: z.boolean().optional(),
    })
    .optional(),
})

export type AccountSettingsBody = z.infer<typeof accountSettingsSchema>
