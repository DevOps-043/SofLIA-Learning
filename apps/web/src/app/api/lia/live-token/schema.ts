import { z } from 'zod';

export const liaLiveTokenSchema = z
  .object({
    sessionId: z.string().uuid().optional(),
    conversationId: z.string().uuid().optional(),
    contextType: z.string().trim().min(1).max(80).optional(),
    pageContext: z.record(z.unknown()).optional().nullable(),
    language: z.string().trim().min(2).max(12).optional(),
    source: z.enum(['embedded_panel', 'side_panel']).default('side_panel'),
  })
  .strict();

export type LiaLiveTokenBody = z.infer<typeof liaLiveTokenSchema>;
