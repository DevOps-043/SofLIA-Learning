import { z } from 'zod';

export const adminTranscodingScanAndQueueSchema = z
  .object({
    bucket: z.string().trim().min(1).max(64).default('course-videos'),
    concurrency: z.number().int().min(1).max(10).default(10),
    folder: z.string().trim().min(1).max(200).default('videos'),
  })
  .strict();

export type AdminTranscodingScanAndQueueBody = z.infer<typeof adminTranscodingScanAndQueueSchema>;
