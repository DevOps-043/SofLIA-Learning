import { z } from 'zod';

export const learningPreviewSchema = z.object({
  kind: z.enum(['course', 'learning_path']),
  targetId: z.string().uuid(),
  locale: z.string().trim().min(1).max(16).optional(),
});

export type LearningPreviewBody = z.infer<typeof learningPreviewSchema>;
