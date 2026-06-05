import { describe, expect, it } from 'vitest';

import { liaVoiceMetricsSchema } from '../schema';

describe('lia voice metrics schema', () => {
  it('accepts the expected metrics contract without message content', () => {
    const parsed = liaVoiceMetricsSchema.safeParse({
      schemaVersion: 1,
      source: 'embedded_panel',
      outcome: 'completed',
      messageId: 'assistant-message-1',
      recordedAt: new Date().toISOString(),
      metrics: {
        timeToFirstTextMs: 250,
        timeToFirstAudioMs: 1450,
        timeToFirstPlaybackSlotMs: 900,
        totalTurnDurationMs: 5000,
        textLength: 280,
        ttsChunkCount: 3,
        ttsSynthesisCount: 3,
        ttsSynthesisAvgMs: 720,
        ttsSynthesisMaxMs: 1100,
        ttsSynthesisFailureCount: 0,
        ttsFallbackCount: 0,
        graceRevealCount: 1,
      },
    });

    expect(parsed.success).toBe(true);
  });

  it('rejects arbitrary content fields', () => {
    const parsed = liaVoiceMetricsSchema.safeParse({
      schemaVersion: 1,
      source: 'embedded_panel',
      outcome: 'completed',
      recordedAt: new Date().toISOString(),
      content: 'texto que no debe viajar en metricas',
      metrics: {
        totalTurnDurationMs: 5000,
        textLength: 280,
        ttsChunkCount: 3,
        ttsSynthesisCount: 3,
        ttsSynthesisFailureCount: 0,
        ttsFallbackCount: 0,
        graceRevealCount: 1,
      },
    });

    expect(parsed.success).toBe(false);
  });
});
