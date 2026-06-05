import { z } from 'zod';

const nonNegativeMetricSchema = z.number().finite().min(0).max(60 * 60 * 1000);
const boundedTextSchema = z.string().trim().min(1).max(20_000);

export const liaLiveTranscriptEntrySchema = z
  .object({
    sequence: z.number().int().min(1).max(2_000),
    role: z.enum(['user', 'assistant']),
    content: boundedTextSchema,
  })
  .strict();

export const liaLiveTranscriptsSchema = z
  .object({
    schemaVersion: z.literal(1),
    sessionId: z.string().uuid(),
    conversationId: z.string().uuid().optional(),
    source: z.enum(['embedded_panel', 'side_panel']),
    outcome: z.enum(['completed', 'stopped', 'error']),
    startedAt: z.string().datetime(),
    endedAt: z.string().datetime(),
    durationMs: nonNegativeMetricSchema,
    model: z.string().trim().min(1).max(120).optional(),
    language: z.string().trim().min(2).max(12).optional(),
    contextType: z.string().trim().min(1).max(80).optional(),
    pageContext: z.record(z.unknown()).nullable().optional(),
    metrics: z
      .object({
        turnCount: z.number().int().min(0).max(2_000),
        userTranscriptCount: z.number().int().min(0).max(2_000),
        assistantTranscriptCount: z.number().int().min(0).max(2_000),
        interruptionCount: z.number().int().min(0).max(2_000),
        errorCount: z.number().int().min(0).max(200),
      })
      .strict(),
    entries: z.array(liaLiveTranscriptEntrySchema).max(2_000),
  })
  .strict()
  .refine((body) => Date.parse(body.endedAt) >= Date.parse(body.startedAt), {
    path: ['endedAt'],
    message: 'endedAt must be after startedAt',
  });

export type LiaLiveTranscriptsBody = z.infer<typeof liaLiveTranscriptsSchema>;
