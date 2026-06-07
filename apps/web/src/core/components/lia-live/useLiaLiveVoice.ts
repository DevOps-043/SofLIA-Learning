'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/utils/logger';
import { LIA_LIVE_TOKEN_PATH } from '@/core/services/lia-live/constants';
import { LiaLiveAudioPlayer } from '@/core/services/lia-live/audio-playback';
import { LiaLiveMicCapture } from '@/core/services/lia-live/audio-capture';
import { LiaLiveTranscriptBuffer } from '@/core/services/lia-live/transcript-buffer';
import {
  reportLiaLiveTranscript,
  type LiaLiveTranscriptOutcome,
  type LiaLiveTranscriptSource,
} from '@/core/services/lia-live/transcript-client';
import {
  connectLiaLiveSession,
  type LiaLiveSessionHandle,
} from '@/core/services/lia-live/live-session.client';

export type LiaLiveStatus = 'idle' | 'connecting' | 'live' | 'error';

export interface UseLiaLiveVoiceOptions {
  conversationId?: string | null;
  contextType?: string;
  pageContext?: Record<string, unknown> | null;
  language?: string;
  source?: LiaLiveTranscriptSource;
}

export interface UseLiaLiveVoiceReturn {
  status: LiaLiveStatus;
  error: string | null;
  isLive: boolean;
  isAssistantSpeaking: boolean;
  start: () => Promise<void>;
  toggle: () => Promise<void>;
  stop: () => void;
  clearError: () => void;
  sendText: (text: string) => void;
}

interface TokenResponse {
  token?: string;
  model?: string;
  systemInstruction?: string;
  languageCode?: string;
  voiceName?: string;
  code?: string;
}

interface LiveSessionMeta {
  sessionId: string;
  startedAt: Date;
  model?: string;
  language?: string;
  reported: boolean;
}

function createLiveSessionId(): string {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error('live_crypto_unavailable');
  }

  return globalThis.crypto.randomUUID();
}

/**
 * Orquesta la conversacion de voz en vivo con SofLIA (Gemini Live):
 * token efimero, sesion WebSocket, captura de microfono, reproduccion del
 * audio del modelo y persistencia oculta de transcripciones.
 */
export function useLiaLiveVoice({
  conversationId,
  contextType = 'general',
  pageContext = null,
  language,
  source = 'side_panel',
}: UseLiaLiveVoiceOptions = {}): UseLiaLiveVoiceReturn {
  const [status, setStatus] = useState<LiaLiveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);

  const sessionRef = useRef<LiaLiveSessionHandle | null>(null);
  const playerRef = useRef<LiaLiveAudioPlayer | null>(null);
  const micRef = useRef<LiaLiveMicCapture | null>(null);
  const activeRef = useRef(false);
  const transcriptBufferRef = useRef(new LiaLiveTranscriptBuffer());
  const sessionMetaRef = useRef<LiveSessionMeta | null>(null);
  const errorCountRef = useRef(0);
  const stopRef = useRef<() => void>(() => undefined);

  const reportTranscript = useCallback(
    (outcome: LiaLiveTranscriptOutcome) => {
      const meta = sessionMetaRef.current;
      if (!meta || meta.reported) return;

      meta.reported = true;
      const endedAt = new Date();
      const snapshot = transcriptBufferRef.current.snapshot();

      reportLiaLiveTranscript({
        schemaVersion: 1,
        sessionId: meta.sessionId,
        conversationId: conversationId ?? undefined,
        source,
        outcome,
        startedAt: meta.startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        durationMs: Math.max(0, endedAt.getTime() - meta.startedAt.getTime()),
        model: meta.model,
        language: meta.language ?? language,
        contextType,
        pageContext,
        metrics: {
          ...snapshot.metrics,
          errorCount: errorCountRef.current,
        },
        entries: snapshot.entries,
      });
    },
    [contextType, conversationId, language, pageContext, source],
  );

  const cleanup = useCallback(() => {
    micRef.current?.stop().catch(() => undefined);
    micRef.current = null;
    sessionRef.current?.close();
    sessionRef.current = null;
    playerRef.current?.close().catch(() => undefined);
    playerRef.current = null;
    setIsAssistantSpeaking(false);
  }, []);

  const stopWithOutcome = useCallback(
    (outcome: LiaLiveTranscriptOutcome = 'stopped') => {
      activeRef.current = false;
      reportTranscript(outcome);
      cleanup();
      setStatus('idle');
    },
    [cleanup, reportTranscript],
  );

  const stop = useCallback(() => {
    stopWithOutcome('stopped');
  }, [stopWithOutcome]);

  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  useEffect(() => () => { stopRef.current(); }, []);

  const start = useCallback(async () => {
    if (activeRef.current) return;

    activeRef.current = true;
    setError(null);
    setIsAssistantSpeaking(false);
    setStatus('connecting');
    errorCountRef.current = 0;
    transcriptBufferRef.current = new LiaLiveTranscriptBuffer();

    const sessionId = createLiveSessionId();
    sessionMetaRef.current = {
      sessionId,
      startedAt: new Date(),
      language,
      reported: false,
    };

    try {
      const response = await fetch(LIA_LIVE_TOKEN_PATH, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          conversationId: conversationId ?? undefined,
          contextType,
          pageContext,
          language,
          source,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as TokenResponse;

      if (!response.ok || !payload.token || !payload.model) {
        throw new Error(payload.code || `token_error_${response.status}`);
      }
      if (!activeRef.current) return;

      const meta = sessionMetaRef.current;
      if (meta) {
        meta.model = payload.model;
        meta.language = payload.languageCode ?? language;
      }

      const player = new LiaLiveAudioPlayer({
        onPlaybackStart: () => setIsAssistantSpeaking(true),
        onPlaybackIdle: () => setIsAssistantSpeaking(false),
      });
      playerRef.current = player;

      const session = await connectLiaLiveSession({
        token: payload.token,
        model: payload.model,
        systemInstruction: payload.systemInstruction,
        languageCode: payload.languageCode,
        voiceName: payload.voiceName,
        onAudio: (base64Pcm) => { void player.enqueue(base64Pcm); },
        onInterrupted: () => {
          transcriptBufferRef.current.markInterrupted();
          player.interrupt();
        },
        onInputTranscript: (text) => transcriptBufferRef.current.appendUserTranscript(text),
        onOutputTranscript: (text) => transcriptBufferRef.current.appendAssistantTranscript(text),
        onTurnComplete: () => transcriptBufferRef.current.completeTurn(),
        onError: (sessionError) => {
          errorCountRef.current += 1;
          logger.error('[lia-live] error de sesion', sessionError);
          setError('live_session_error');
          stopWithOutcome('error');
          setStatus('error');
        },
        onClose: () => { if (activeRef.current) stopWithOutcome('completed'); },
      });

      if (!activeRef.current) {
        session.close();
        return;
      }
      sessionRef.current = session;

      const mic = new LiaLiveMicCapture();
      micRef.current = mic;
      await mic.start((base64Pcm16) => sessionRef.current?.sendAudioChunk(base64Pcm16));

      if (!activeRef.current) {
        stopWithOutcome('stopped');
        return;
      }
      setStatus('live');
    } catch (startError) {
      logger.error('[lia-live] no se pudo iniciar la voz en vivo', startError);
      errorCountRef.current += 1;
      activeRef.current = false;
      reportTranscript('error');
      cleanup();
      setError(startError instanceof Error ? startError.message : 'live_error');
      setStatus('error');
    }
  }, [
    cleanup,
    contextType,
    conversationId,
    language,
    pageContext,
    reportTranscript,
    source,
    stopWithOutcome,
  ]);

  const toggle = useCallback(async () => {
    if (activeRef.current) {
      stop();
      return;
    }
    await start();
  }, [start, stop]);

  const sendText = useCallback((text: string) => {
    sessionRef.current?.sendText(text);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    status,
    error,
    isLive: status === 'live',
    isAssistantSpeaking,
    start,
    toggle,
    stop,
    clearError,
    sendText,
  };
}
