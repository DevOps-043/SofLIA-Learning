'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSofLIAPersonalization } from './useSofLIAPersonalization';
import { cleanTextForSpeech } from '../services/tts/client/clean-text';
import {
  StreamingSpeechPlayer,
  findFirstSpeakableBoundary,
} from '../services/tts/client/streaming-speech-player';
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
const FIRST_SPEECH_BOUNDARY = { minChars: 12, softCap: 56 };
const REST_SPEECH_BOUNDARY = { minChars: 80, softCap: 220 };
const STREAMING_CHUNKS_BEFORE_FINAL = 3;
const MAX_TTS_CHUNKS_PER_TURN = 4;

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
  }>({
    messageId: null,
    consumed: 0,
    queuedChunks: 0,
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
        revealTextThrough(messageId, endIndex);
      }, REVEAL_GRACE_AFTER_AUDIO_SLOT_MS);

      revealTimersRef.current.add(timer);
      clearTimerRef.current = () => {
        globalThis.clearTimeout(timer);
        revealTimersRef.current.delete(timer);
      };
    },
    [revealTextThrough],
  );

  const stop = useCallback(() => {
    clearRevealTimers();
    playerRef.current?.stop();
    playerRef.current = null;
    stateRef.current = { messageId: null, consumed: 0, queuedChunks: 0 };
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

  const enqueueWithReveal = useCallback(
    (messageId: string, chunk: string, endIndex: number) => {
      const player = playerRef.current;
      if (!player) return;

      const clean = cleanTextForSpeech(chunk);
      if (!clean) {
        revealTextThrough(messageId, endIndex);
        return;
      }

      const clearGraceTimerRef: { current: (() => void) | null } = { current: null };
      const reveal = (event: { audioAvailable: boolean }) => {
        clearGraceTimerRef.current?.();
        clearGraceTimerRef.current = null;
        metricsTrackerRef.current.recordChunkStarted(event.audioAvailable);
        revealTextThrough(messageId, endIndex);
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
      }
    },
    [revealTextThrough, scheduleGraceReveal],
  );

  const armForNextResponse = useCallback(() => {
    clearRevealTimers();
    playerRef.current?.stop();
    playerRef.current = null;
    stateRef.current = { messageId: null, consumed: 0, queuedChunks: 0 };
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
      stateRef.current = { messageId: lastMessage.id, consumed: 0, queuedChunks: 0 };
      streamFinishedRef.current = false;
      metricsTrackerRef.current.attachMessage(lastMessage.id);
      setVoiceReveal({ messageId: lastMessage.id, length: 0 });
    }

    if (content.length > 0) {
      metricsTrackerRef.current.markFirstText();
    }

    const pending = content.slice(stateRef.current.consumed);

    if (isLoading) {
      if (stateRef.current.queuedChunks >= STREAMING_CHUNKS_BEFORE_FINAL) {
        return;
      }

      const boundary = stateRef.current.consumed === 0
        ? findFirstSpeakableBoundary(pending, FIRST_SPEECH_BOUNDARY)
        : findFirstSpeakableBoundary(pending, REST_SPEECH_BOUNDARY);

      if (boundary > 0) {
        const endIndex = stateRef.current.consumed + boundary;
        enqueueWithReveal(lastMessage.id, pending.slice(0, boundary), endIndex);
        stateRef.current.consumed = endIndex;
      }
      return;
    }

    let finalPending = pending;
    while (
      finalPending.trim() &&
      stateRef.current.queuedChunks < MAX_TTS_CHUNKS_PER_TURN
    ) {
      const slotsLeft = MAX_TTS_CHUNKS_PER_TURN - stateRef.current.queuedChunks;
      const boundary = slotsLeft <= 1
        ? finalPending.length
        : findFirstSpeakableBoundary(finalPending, REST_SPEECH_BOUNDARY);
      const chunkLength = boundary > 0 ? boundary : finalPending.length;
      const endIndex = stateRef.current.consumed + chunkLength;

      enqueueWithReveal(lastMessage.id, finalPending.slice(0, chunkLength), endIndex);
      stateRef.current.consumed = endIndex;
      finalPending = content.slice(stateRef.current.consumed);
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
