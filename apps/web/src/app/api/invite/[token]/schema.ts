import { z } from 'zod';

export const acceptInviteSchema = z
  .object({
    userId: z.string().trim().min(1).max(120).optional(),
  })
  .passthrough();

export type AcceptInviteBody = z.infer<typeof acceptInviteSchema>;
