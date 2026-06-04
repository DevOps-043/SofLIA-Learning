import { afterEach, describe, expect, it, vi } from 'vitest';

import { LiaVoiceMetricsTracker } from '../lia-voice-metrics.client';

describe('LiaVoiceMetricsTracker', () => {
  const originalSendBeacon = navigator.sendBeacon;

  afterEach(() => {
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: originalSendBeacon,
    });
    vi.restoreAllMocks();
  });

  it('reports a sanitized per-turn voice metrics summary', async () => {
    const sendBeacon = vi.fn(() => true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });

    const tracker = new LiaVoiceMetricsTracker('embedded_panel');

    tracker.startTurn();
    tracker.attachMessage('assistant-message-1');
    tracker.markFirstText();
    tracker.recordChunkQueued();
    tracker.recordSynthesisResult({
      durationMs: 123,
      audioAvailable: true,
      failed: false,
    });
    tracker.recordPlaybackSlot();
    tracker.recordChunkStarted(true);
    tracker.recordGraceReveal();
    tracker.completeStream(42);
    tracker.flush('completed');

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(sendBeacon).toHaveBeenCalledWith(
      '/api/lia/voice-metrics',
      expect.any(Blob),
    );

    const [, blob] = sendBeacon.mock.calls[0] as [string, Blob];
    const payload = JSON.parse(await blob.text());

    expect(payload).toMatchObject({
      schemaVersion: 1,
      source: 'embedded_panel',
      outcome: 'completed',
      messageId: 'assistant-message-1',
      metrics: {
        textLength: 42,
        ttsChunkCount: 1,
        ttsSynthesisCount: 1,
        ttsSynthesisAvgMs: 123,
        ttsSynthesisMaxMs: 123,
        graceRevealCount: 1,
      },
    });
    expect(JSON.stringify(payload)).not.toContain('content');
  });
});
