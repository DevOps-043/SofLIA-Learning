import { z } from 'zod';

export const recalculateDurationsSchema = z
  .object({
    courseId: z.string().trim().min(1).max(128).optional(),
  })
  .strict();

export type RecalculateDurationsBody = z.infer<typeof recalculateDurationsSchema>;
