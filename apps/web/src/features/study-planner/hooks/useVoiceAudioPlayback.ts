'use client';

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useCallback, useRef, useState } from 'react';
import { isTTSAbortError, requestTTSAudio, speakWithWebSpeech } from '../../../core/services/tts';
import {
  formatTextForTTS,
  resolveSpeechQueue,
  type VoicePlaybackMode,
} from '../services/study-planner-voice-text.service';

const ELEVENLABS_CONFIG = {
  speed: 1.1,
  stability: 0.75,
  similarity_boost: 0.8,
  style: 0.85,
  use_speaker_boost: true,
};

export interface UseVoiceAudioPlaybackResult {
  isSpeaking: boolean;
  isSpeakingRef: React.MutableRefObject<boolean>;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  utteranceRef: React.MutableRefObject<SpeechSynthesisUtterance | null>;
  ttsAbortRef: React.MutableRefObject<AbortController | null>;
  speechQueueRef: React.MutableRefObject<string[]>;
  speakText: (text: string, mode?: VoicePlaybackMode) => Promise<void>;
  stopAllAudio: (mode?: VoicePlaybackMode) => void;
}

export function useVoiceAudioPlayback(
  isAudioEnabledRef: React.MutableRefObject<boolean>,
): UseVoiceAudioPlaybackResult {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const speechQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef(false);

  const playAudioBlobWithAbort = useCallback(async (blob: Blob, controller: AbortController) => {
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audio.volume = 0.8;
    audioRef.current = audio;

    await new Promise<void>((resolve, reject) => {
      let settled = false;

      const cleanup = () => {
        if (audioRef.current === audio) audioRef.current = null;
        URL.revokeObjectURL(audioUrl);
        controller.signal.removeEventListener('abort', handleAbort);
        audio.onended = null;
        audio.onerror = null;
      };

      const finish = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };

      const handleAbort = () => { audio.pause(); finish(); };
      controller.signal.addEventListener('abort', handleAbort, { once: true });
      audio.onended = finish;
      audio.onerror = finish;
      audio.play().catch((error) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      });
    });
  }, []);

  const speakWithBrowserVoice = useCallback(async (text: string, controller: AbortController) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    await new Promise<void>((resolve) => {
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        controller.signal.removeEventListener('abort', handleAbort);
        resolve();
      };

      const handleAbort = () => {
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
        finish();
      };

      controller.signal.addEventListener('abort', handleAbort, { once: true });
      speakWithWebSpeech(text, utteranceRef, { lang: 'es-MX', rate: 0.92, pitch: 1, volume: 0.8 }, finish);
    });
  }, []);

  const stopAllAudio = useCallback((mode: VoicePlaybackMode = 'interruptByUser') => {
    try {
      if (ttsAbortRef.current) {
        try { ttsAbortRef.current.abort(); } catch { /* ignore abort races */ }
        ttsAbortRef.current = null;
      }
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
      }
      if (mode !== 'enqueue') speechQueueRef.current = [];
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    } catch (error) {
      techDebtLogger.warn('Error deteniendo audio:', error);
    }
  }, []);

  const playQueuedText = useCallback(async (spokenText: string) => {
    if (!spokenText || typeof window === 'undefined') return;

    const controller = new AbortController();
    ttsAbortRef.current = controller;
    isSpeakingRef.current = true;
    setIsSpeaking(true);

    try {
      const audioBlob = await requestTTSAudio(
        { text: spokenText, voiceSettings: ELEVENLABS_CONFIG, speed: ELEVENLABS_CONFIG.speed },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      if (!audioBlob) {
        await speakWithBrowserVoice(spokenText, controller);
        return;
      }
      await playAudioBlobWithAbort(audioBlob, controller);
    } catch (error) {
      if (!isTTSAbortError(error)) techDebtLogger.error('Error en sintesis de voz con ElevenLabs:', error);
    } finally {
      if (ttsAbortRef.current === controller) ttsAbortRef.current = null;
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    }
  }, [playAudioBlobWithAbort, speakWithBrowserVoice]);

  const drainSpeechQueue = useCallback(async () => {
    if (isSpeakingRef.current) return;
    const nextText = speechQueueRef.current.shift();
    if (!nextText) return;
    await playQueuedText(nextText);
    if (speechQueueRef.current.length > 0) await drainSpeechQueue();
  }, [playQueuedText]);

  const speakText = useCallback(async (text: string, mode: VoicePlaybackMode = 'enqueue') => {
    if (!isAudioEnabledRef.current || typeof window === 'undefined') return;
    const spokenText = formatTextForTTS(text);
    if (!spokenText) return;
    if (mode !== 'enqueue') stopAllAudio(mode);
    speechQueueRef.current = resolveSpeechQueue(
      mode === 'enqueue' ? speechQueueRef.current : [],
      spokenText,
      mode,
    );
    if (!isSpeakingRef.current) await drainSpeechQueue();
  }, [drainSpeechQueue, isAudioEnabledRef, stopAllAudio]);

  return { isSpeaking, isSpeakingRef, audioRef, utteranceRef, ttsAbortRef, speechQueueRef, speakText, stopAllAudio };
}
