import { z } from 'zod';

const nonNegativeMetricSchema = z.number().finite().min(0).max(10 * 60 * 1000);

export const liaVoiceMetricsSchema = z.object({
  schemaVersion: z.literal(1),
  source: z.enum(['embedded_panel', 'side_panel']),
  outcome: z.enum(['completed', 'stopped', 'error']),
  messageId: z.string().min(1).max(160).optional(),
  recordedAt: z.string().datetime(),
  metrics: z
    .object({
      timeToFirstTextMs: nonNegativeMetricSchema.optional(),
      timeToFirstAudioMs: nonNegativeMetricSchema.optional(),
      timeToFirstPlaybackSlotMs: nonNegativeMetricSchema.optional(),
      totalTurnDurationMs: nonNegativeMetricSchema,
      textLength: z.number().int().min(0).max(200_000),
      ttsChunkCount: z.number().int().min(0).max(500),
      ttsSynthesisCount: z.number().int().min(0).max(500),
      ttsSynthesisAvgMs: nonNegativeMetricSchema.optional(),
      ttsSynthesisMaxMs: nonNegativeMetricSchema.optional(),
      ttsSynthesisFailureCount: z.number().int().min(0).max(500),
      ttsFallbackCount: z.number().int().min(0).max(500),
      graceRevealCount: z.number().int().min(0).max(500),
    })
    .strict(),
}).strict();

export type LiaVoiceMetricsBody = z.infer<typeof liaVoiceMetricsSchema>;
