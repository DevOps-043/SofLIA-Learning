'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/utils/logger';
import { LIA_LIVE_TOKEN_PATH } from '@/core/services/lia-live/constants';
import { LiaLiveAudioPlayer } from '@/core/services/lia-live/audio-playback';
import { LiaLiveMicCapture } from '@/core/services/lia-live/audio-capture';
import {
  connectLiaLiveSession,
  type LiaLiveSessionHandle,
} from '@/core/services/lia-live/live-session.client';

export type LiaLiveStatus = 'idle' | 'connecting' | 'live' | 'error';

export interface UseLiaLiveVoiceReturn {
  status: LiaLiveStatus;
  error: string | null;
  isLive: boolean;
  /** Inicia (o detiene si ya está activa) la conversación de voz en vivo. */
  toggle: () => Promise<void>;
  stop: () => void;
  /** Envía texto a la sesión en vivo (modo texto↔voz). */
  sendText: (text: string) => void;
}

interface TokenResponse {
  token?: string;
  model?: string;
  code?: string;
}

/**
 * Orquesta la conversación de voz en vivo con SofLIA (Gemini Live):
 * token efímero → sesión WebSocket → captura de micrófono → reproducción del
 * audio del modelo, con barge-in (interrupción) y limpieza de recursos.
 *
 * Degradación: si la voz en vivo no está disponible (503/permiso de micrófono),
 * queda en estado `error` y el consumidor mantiene el TTS/STT actual.
 */
export function useLiaLiveVoice(): UseLiaLiveVoiceReturn {
  const [status, setStatus] = useState<LiaLiveStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<LiaLiveSessionHandle | null>(null);
  const playerRef = useRef<LiaLiveAudioPlayer | null>(null);
  const micRef = useRef<LiaLiveMicCapture | null>(null);
  const activeRef = useRef(false);

  const cleanup = useCallback(() => {
    micRef.current?.stop().catch(() => { /* ignore */ });
    micRef.current = null;
    sessionRef.current?.close();
    sessionRef.current = null;
    playerRef.current?.close().catch(() => { /* ignore */ });
    playerRef.current = null;
  }, []);

  const stop = useCallback(() => {
    activeRef.current = false;
    cleanup();
    setStatus('idle');
  }, [cleanup]);

  useEffect(() => () => { stop(); }, [stop]);

  const start = useCallback(async () => {
    activeRef.current = true;
    setError(null);
    setStatus('connecting');

    try {
      const response = await fetch(LIA_LIVE_TOKEN_PATH, { method: 'POST', credentials: 'include' });
      const payload = (await response.json().catch(() => ({}))) as TokenResponse;

      if (!response.ok || !payload.token || !payload.model) {
        throw new Error(payload.code || `token_error_${response.status}`);
      }
      if (!activeRef.current) return;

      const player = new LiaLiveAudioPlayer();
      playerRef.current = player;

      const session = await connectLiaLiveSession({
        token: payload.token,
        model: payload.model,
        onAudio: (base64Pcm) => { void player.enqueue(base64Pcm); },
        onInterrupted: () => player.interrupt(),
        onError: (sessionError) => logger.error('[lia-live] error de sesión', sessionError),
        onClose: () => { if (activeRef.current) stop(); },
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
        stop();
        return;
      }
      setStatus('live');
    } catch (startError) {
      logger.error('[lia-live] no se pudo iniciar la voz en vivo', startError);
      activeRef.current = false;
      cleanup();
      setError(startError instanceof Error ? startError.message : 'live_error');
      setStatus('error');
    }
  }, [cleanup, stop]);

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

  return { status, error, isLive: status === 'live', toggle, stop, sendText };
}
