'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSofLIAPersonalization } from './useSofLIAPersonalization';
import { cleanTextForSpeech } from '../services/tts/client/clean-text';
import { StreamingSpeechPlayer } from '../services/tts/client/streaming-speech-player';
import { registerAudioUnlock } from '../services/tts/client/ios-audio-unlock';
import {
  STREAM_LOOKAHEAD_CHUNKS,
  nextFinalChunkLength,
  nextStreamingChunkLength,
} from '../services/tts/client/speech-chunker';
import { LiaVoiceMetricsTracker } from '../services/lia-voice-metrics.client';
import type { SofLIAMessage } from '../types/lia.types';

interface UseStreamingChatVoiceParams {
  messages: SofLIAMessage[];
  isLoading: boolean;
}

export interface StreamingVoiceRevealState {
  messageId: string | null;
  length: number;
}

interface UseStreamingChatVoiceReturn {
  /**
   * Arms voice for the next assistant answer. Call it immediately when the user
   * sends a message so greetings and loaded history are not spoken.
   */
  armForNextResponse: () => void;
  /** Stops queued synthesis and current playback. */
  stop: () => void;
  isSpeaking: boolean;
  voiceReveal: StreamingVoiceRevealState;
}

const NO_REVEAL: StreamingVoiceRevealState = { messageId: null, length: 0 };
const REVEAL_GRACE_AFTER_AUDIO_SLOT_MS = 900;

/**
 * Speaks a streamed assistant answer chunk by chunk, while exposing how much
 * text should be visible when voice mode is active. Text reveal is normally
 * driven by audio start; if TTS stalls after the fragment reaches its playback
 * slot, a short grace timer reveals the text to avoid a frozen/cut-looking UI.
 */
export function useStreamingChatVoice({
  messages,
  isLoading,
}: UseStreamingChatVoiceParams): UseStreamingChatVoiceReturn {
  const { settings } = useSofLIAPersonalization();
  const isVoiceEnabled = settings?.voice_enabled ?? true;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceReveal, setVoiceReveal] =
    useState<StreamingVoiceRevealState>(NO_REVEAL);

  const metricsTrackerRef = useRef(new LiaVoiceMetricsTracker('embedded_panel'));
  const playerRef = useRef<StreamingSpeechPlayer | null>(null);
  const stateRef = useRef<{
    messageId: string | null;
    consumed: number;
    queuedChunks: number;
    startedChunks: number;
  }>({
    messageId: null,
    consumed: 0,
    queuedChunks: 0,
    startedChunks: 0,
  });
  const revealTimersRef = useRef<Set<ReturnType<typeof globalThis.setTimeout>>>(
    new Set(),
  );
  const armedRef = useRef(false);
  const isPlayingRef = useRef(false);
  const streamFinishedRef = useRef(false);

  const clearRevealTimers = useCallback(() => {
    revealTimersRef.current.forEach((timer) => globalThis.clearTimeout(timer));
    revealTimersRef.current.clear();
  }, []);

  const revealTextThrough = useCallback((messageId: string, length: number) => {
    setVoiceReveal((prev) =>
      prev.messageId === messageId ? { messageId, length } : prev,
    );
  }, []);

  // Marca que un fragmento ya "arrancó" (audio sonando o revelado por gracia) y
  // revela su texto. `startedChunks` alimenta el look-ahead del streaming. Se
  // invoca una sola vez por fragmento (las rutas audio/gracia son excluyentes).
  const markChunkStarted = useCallback(
    (messageId: string, endIndex: number) => {
      if (stateRef.current.messageId === messageId) {
        stateRef.current.startedChunks += 1;
      }
      revealTextThrough(messageId, endIndex);
    },
    [revealTextThrough],
  );

  const scheduleGraceReveal = useCallback(
    (
      messageId: string,
      endIndex: number,
      clearTimerRef: { current: (() => void) | null },
    ) => {
      const timer = globalThis.setTimeout(() => {
        revealTimersRef.current.delete(timer);
        clearTimerRef.current = null;
        metricsTrackerRef.current.recordGraceReveal();
        markChunkStarted(messageId, endIndex);
      }, REVEAL_GRACE_AFTER_AUDIO_SLOT_MS);

      revealTimersRef.current.add(timer);
      clearTimerRef.current = () => {
        globalThis.clearTimeout(timer);
        revealTimersRef.current.delete(timer);
      };
    },
    [markChunkStarted],
  );

  const stop = useCallback(() => {
    clearRevealTimers();
    playerRef.current?.stop();
    playerRef.current = null;
    stateRef.current = { messageId: null, consumed: 0, queuedChunks: 0, startedChunks: 0 };
    armedRef.current = false;
    isPlayingRef.current = false;
    streamFinishedRef.current = false;
    metricsTrackerRef.current.flush('stopped');
    setIsSpeaking(false);
    setVoiceReveal(NO_REVEAL);
  }, [clearRevealTimers]);

  const handlePlayingChange = useCallback((playing: boolean) => {
    isPlayingRef.current = playing;
    setIsSpeaking(playing);

    if (!playing && streamFinishedRef.current) {
      metricsTrackerRef.current.flush('completed');
    }
  }, []);

  // Devuelve `true` si el reproductor aceptó el fragmento. Si no (sin player,
  // texto vacío o tope de seguridad), revela el texto igualmente para que la
  // transcripción no quede incompleta.
  const enqueueWithReveal = useCallback(
    (messageId: string, chunk: string, endIndex: number): boolean => {
      const player = playerRef.current;
      if (!player) {
        revealTextThrough(messageId, endIndex);
        return false;
      }

      const clean = cleanTextForSpeech(chunk);
      if (!clean) {
        revealTextThrough(messageId, endIndex);
        return true;
      }

      const clearGraceTimerRef: { current: (() => void) | null } = { current: null };
      const reveal = (event: { audioAvailable: boolean }) => {
        clearGraceTimerRef.current?.();
        clearGraceTimerRef.current = null;
        metricsTrackerRef.current.recordChunkStarted(event.audioAvailable);
        markChunkStarted(messageId, endIndex);
      };

      const accepted = player.enqueue(
        clean,
        reveal,
        () => {
          metricsTrackerRef.current.recordPlaybackSlot();
          scheduleGraceReveal(messageId, endIndex, clearGraceTimerRef);
        },
        (event) => metricsTrackerRef.current.recordSynthesisResult(event),
      );
      if (accepted) {
        metricsTrackerRef.current.recordChunkQueued();
        stateRef.current.queuedChunks += 1;
        return true;
      }

      revealTextThrough(messageId, endIndex);
      return false;
    },
    [markChunkStarted, revealTextThrough, scheduleGraceReveal],
  );

  const armForNextResponse = useCallback(() => {
    clearRevealTimers();
    playerRef.current?.stop();
    playerRef.current = null;
    stateRef.current = { messageId: null, consumed: 0, queuedChunks: 0, startedChunks: 0 };
    setIsSpeaking(false);
    setVoiceReveal(NO_REVEAL);
    isPlayingRef.current = false;
    streamFinishedRef.current = false;
    armedRef.current = isVoiceEnabled;
    if (isVoiceEnabled) {
      metricsTrackerRef.current.startTurn();
    } else {
      metricsTrackerRef.current.flush('stopped');
    }
  }, [clearRevealTimers, isVoiceEnabled]);

  // Activa los listeners de gesto que desbloquean el audio en iOS/WebKit ANTES de
  // que el usuario envíe su primer mensaje (ver `ios-audio-unlock`). Idempotente.
  useEffect(() => { registerAudioUnlock(); }, []);

  useEffect(() => () => { stop(); }, [stop]);

  useEffect(() => {
    if (!isVoiceEnabled) {
      stop();
    }
  }, [isVoiceEnabled, stop]);

  useEffect(() => {
    if (!armedRef.current || !isVoiceEnabled) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') return;

    const content = lastMessage.content ?? '';

    if (stateRef.current.messageId !== lastMessage.id) {
      playerRef.current?.stop();
      playerRef.current = new StreamingSpeechPlayer({
        onPlayingChange: handlePlayingChange,
      });
      stateRef.current = {
        messageId: lastMessage.id,
        consumed: 0,
        queuedChunks: 0,
        startedChunks: 0,
      };
      streamFinishedRef.current = false;
      metricsTrackerRef.current.attachMessage(lastMessage.id);
      setVoiceReveal({ messageId: lastMessage.id, length: 0 });
    }

    if (content.length > 0) {
      metricsTrackerRef.current.markFirstText();
    }

    if (isLoading) {
      // Drena las oraciones COMPLETAS ya recibidas manteniendo solo un pequeño
      // look-ahead por delante de la reproducción, para que el audio fluya de
      // forma continua incluso en respuestas largas sin pre-sintetizar todo.
      let pending = content.slice(stateRef.current.consumed);
      while (
        stateRef.current.queuedChunks - stateRef.current.startedChunks <
        STREAM_LOOKAHEAD_CHUNKS
      ) {
        const boundary = nextStreamingChunkLength(pending, stateRef.current.consumed === 0);
        if (boundary <= 0) break; // aún conviene esperar más texto
        const endIndex = stateRef.current.consumed + boundary;
        enqueueWithReveal(lastMessage.id, pending.slice(0, boundary), endIndex);
        stateRef.current.consumed = endIndex;
        pending = content.slice(stateRef.current.consumed);
      }
      return;
    }

    // Fin de la respuesta: locuta/revela TODO el remanente en fragmentos por
    // oración (sin tope de número de chunks) para que las respuestas largas se
    // lean completas en lugar de cortarse al cuarto fragmento.
    let finalPending = content.slice(stateRef.current.consumed);
    while (finalPending.trim()) {
      const chunkLength = nextFinalChunkLength(finalPending, stateRef.current.consumed === 0);
      const endIndex = stateRef.current.consumed + chunkLength;

      const accepted = enqueueWithReveal(lastMessage.id, finalPending.slice(0, chunkLength), endIndex);
      stateRef.current.consumed = endIndex;
      finalPending = content.slice(stateRef.current.consumed);
      if (!accepted) break; // tope de seguridad del reproductor; texto ya revelado
    }
    metricsTrackerRef.current.completeStream(content.length);
    streamFinishedRef.current = true;
    if (!isPlayingRef.current) {
      metricsTrackerRef.current.flush('completed');
    }
    armedRef.current = false;
  }, [messages, isLoading, isVoiceEnabled, enqueueWithReveal, handlePlayingChange]);

  return { armForNextResponse, stop, isSpeaking, voiceReveal };
}
