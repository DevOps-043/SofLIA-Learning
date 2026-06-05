'use client';

export type LiaVoiceMetricSource = 'embedded_panel' | 'side_panel';
export type LiaVoiceMetricOutcome = 'completed' | 'stopped' | 'error';

export interface LiaVoiceMetricsPayload {
  schemaVersion: 1;
  source: LiaVoiceMetricSource;
  outcome: LiaVoiceMetricOutcome;
  messageId?: string;
  recordedAt: string;
  metrics: {
    timeToFirstTextMs?: number;
    timeToFirstAudioMs?: number;
    timeToFirstPlaybackSlotMs?: number;
    totalTurnDurationMs: number;
    textLength: number;
    ttsChunkCount: number;
    ttsSynthesisCount: number;
    ttsSynthesisAvgMs?: number;
    ttsSynthesisMaxMs?: number;
    ttsSynthesisFailureCount: number;
    ttsFallbackCount: number;
    graceRevealCount: number;
  };
}

interface VoiceMetricsTurn {
  source: LiaVoiceMetricSource;
  startedAt: number;
  messageId?: string;
  firstTextAt?: number;
  firstAudioAt?: number;
  firstPlaybackSlotAt?: number;
  completedAt?: number;
  textLength: number;
  ttsChunkCount: number;
  ttsSynthesisDurationsMs: number[];
  ttsSynthesisFailureCount: number;
  ttsFallbackCount: number;
  graceRevealCount: number;
  reported: boolean;
}

const LIA_VOICE_METRICS_ENDPOINT = '/api/lia/voice-metrics';

function getNowMs(): number {
  return globalThis.performance?.now() ?? Date.now();
}

function roundMetric(value: number): number {
  return Math.max(0, Math.round(value));
}

function average(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function reportLiaVoiceMetrics(payload: LiaVoiceMetricsPayload): void {
  if (typeof window === 'undefined') return;

  const body = JSON.stringify(payload);
  const beaconPayload = new Blob([body], { type: 'application/json' });

  if (typeof navigator !== 'undefined' && navigator.sendBeacon?.(LIA_VOICE_METRICS_ENDPOINT, beaconPayload)) {
    return;
  }

  fetch(LIA_VOICE_METRICS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // Best-effort telemetry: user experience must never depend on metrics.
  });
}

export class LiaVoiceMetricsTracker {
  private turn: VoiceMetricsTurn | null = null;

  constructor(private readonly source: LiaVoiceMetricSource) {}

  startTurn(startedAt?: number): void {
    this.flush('stopped');
    this.turn = {
      source: this.source,
      startedAt: startedAt ?? getNowMs(),
      textLength: 0,
      ttsChunkCount: 0,
      ttsSynthesisDurationsMs: [],
      ttsSynthesisFailureCount: 0,
      ttsFallbackCount: 0,
      graceRevealCount: 0,
      reported: false,
    };
  }

  attachMessage(messageId: string): void {
    if (!this.turn) return;
    this.turn.messageId = messageId;
  }

  markFirstText(): void {
    if (!this.turn || this.turn.firstTextAt !== undefined) return;
    this.turn.firstTextAt = getNowMs();
  }

  recordPlaybackSlot(): void {
    if (!this.turn || this.turn.firstPlaybackSlotAt !== undefined) return;
    this.turn.firstPlaybackSlotAt = getNowMs();
  }

  recordChunkQueued(): void {
    if (!this.turn) return;
    this.turn.ttsChunkCount += 1;
  }

  recordChunkStarted(audioAvailable: boolean): void {
    if (!this.turn) return;
    if (!audioAvailable) return;

    if (this.turn.firstAudioAt === undefined) {
      this.turn.firstAudioAt = getNowMs();
    }
  }

  recordSynthesisResult(params: {
    durationMs: number;
    audioAvailable: boolean;
    failed: boolean;
  }): void {
    if (!this.turn) return;

    this.turn.ttsSynthesisDurationsMs.push(params.durationMs);
    if (params.failed) {
      this.turn.ttsSynthesisFailureCount += 1;
    }
    if (!params.audioAvailable) {
      this.turn.ttsFallbackCount += 1;
    }
  }

  recordGraceReveal(): void {
    if (!this.turn) return;
    this.turn.graceRevealCount += 1;
  }

  completeStream(textLength: number): void {
    if (!this.turn) return;
    this.turn.textLength = textLength;
    this.turn.completedAt = getNowMs();
  }

  flush(outcome: LiaVoiceMetricOutcome): void {
    const turn = this.turn;
    if (!turn || turn.reported) return;

    turn.reported = true;
    const finishedAt = getNowMs();
    const avgSynthesisMs = average(turn.ttsSynthesisDurationsMs);
    const maxSynthesisMs = turn.ttsSynthesisDurationsMs.length > 0
      ? Math.max(...turn.ttsSynthesisDurationsMs)
      : undefined;

    reportLiaVoiceMetrics({
      schemaVersion: 1,
      source: turn.source,
      outcome,
      messageId: turn.messageId,
      recordedAt: new Date().toISOString(),
      metrics: {
        timeToFirstTextMs: turn.firstTextAt !== undefined
          ? roundMetric(turn.firstTextAt - turn.startedAt)
          : undefined,
        timeToFirstAudioMs: turn.firstAudioAt !== undefined
          ? roundMetric(turn.firstAudioAt - turn.startedAt)
          : undefined,
        timeToFirstPlaybackSlotMs: turn.firstPlaybackSlotAt !== undefined
          ? roundMetric(turn.firstPlaybackSlotAt - turn.startedAt)
          : undefined,
        totalTurnDurationMs: roundMetric(finishedAt - turn.startedAt),
        textLength: turn.textLength,
        ttsChunkCount: turn.ttsChunkCount,
        ttsSynthesisCount: turn.ttsSynthesisDurationsMs.length,
        ttsSynthesisAvgMs: avgSynthesisMs !== undefined ? roundMetric(avgSynthesisMs) : undefined,
        ttsSynthesisMaxMs: maxSynthesisMs !== undefined ? roundMetric(maxSynthesisMs) : undefined,
        ttsSynthesisFailureCount: turn.ttsSynthesisFailureCount,
        ttsFallbackCount: turn.ttsFallbackCount,
        graceRevealCount: turn.graceRevealCount,
      },
    });

    this.turn = null;
  }
}
