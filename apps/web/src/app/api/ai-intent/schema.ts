import { z } from 'zod';

export const aiIntentRequestSchema = z.object({
  message: z.string().trim().min(1).max(500),
});

export type AiIntentRequestBody = z.infer<typeof aiIntentRequestSchema>;

export const aiIntentResultSchema = z.object({
  intent: z.enum(['create_prompt', 'navigate', 'question', 'feedback', 'general']),
  confidence: z.number().min(0).max(1),
  entities: z.record(z.unknown()).optional(),
});

export type AiIntentResult = z.infer<typeof aiIntentResultSchema>;
