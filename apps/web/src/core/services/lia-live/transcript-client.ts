'use client';

import { LIA_LIVE_TRANSCRIPTS_PATH } from './constants';
import type { LiaLiveTranscriptEntry } from './transcript-buffer';

export type LiaLiveTranscriptOutcome = 'completed' | 'stopped' | 'error';
export type LiaLiveTranscriptSource = 'embedded_panel' | 'side_panel';

export interface LiaLiveTranscriptPayload {
  schemaVersion: 1;
  sessionId: string;
  conversationId?: string;
  source: LiaLiveTranscriptSource;
  outcome: LiaLiveTranscriptOutcome;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  model?: string;
  language?: string;
  contextType?: string;
  pageContext?: Record<string, unknown> | null;
  metrics: {
    turnCount: number;
    userTranscriptCount: number;
    assistantTranscriptCount: number;
    interruptionCount: number;
    errorCount: number;
  };
  entries: LiaLiveTranscriptEntry[];
}

export function reportLiaLiveTranscript(payload: LiaLiveTranscriptPayload): void {
  if (typeof window === 'undefined') return;

  const body = JSON.stringify(payload);
  const beaconPayload = new Blob([body], { type: 'application/json' });

  if (typeof navigator !== 'undefined' && navigator.sendBeacon?.(LIA_LIVE_TRANSCRIPTS_PATH, beaconPayload)) {
    return;
  }

  fetch(LIA_LIVE_TRANSCRIPTS_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // Best-effort audit trail: the live voice UX must not depend on persistence.
  });
}
