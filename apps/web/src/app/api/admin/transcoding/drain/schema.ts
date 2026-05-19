import { z } from 'zod';

export const adminTranscodingDrainSchema = z
  .object({
    concurrency: z.number().int().min(1).max(10).default(10),
  })
  .strict();

export type AdminTranscodingDrainBody = z.infer<typeof adminTranscodingDrainSchema>;
