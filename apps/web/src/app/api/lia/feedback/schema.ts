import { z } from 'zod';

export const liaFeedbackSchema = z.object({
  messageId: z.string().uuid('messageId debe ser un UUID valido'),
  feedbackType: z.enum(['helpful', 'not_helpful', 'incorrect', 'confusing']),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().max(2000).optional(),
});

export type LiaFeedbackInput = z.infer<typeof liaFeedbackSchema>;
