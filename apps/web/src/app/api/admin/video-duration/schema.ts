import { z } from 'zod';

export const adminVideoDurationSchema = z
  .object({
    provider: z.enum(['youtube', 'vimeo', 'custom']),
    videoIdOrUrl: z.string().trim().min(1).max(2048),
  })
  .strict();

export type AdminVideoDurationBody = z.infer<typeof adminVideoDurationSchema>;
