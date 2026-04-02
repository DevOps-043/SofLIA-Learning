'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_ELEVENLABS_MODEL_ID,
  DEFAULT_ELEVENLABS_VOICE_ID,
  DEFAULT_TTS_OPTIMIZE_STREAMING_LATENCY,
  DEFAULT_TTS_OUTPUT_FORMAT,
  isTTSAbortError,
  playAudioBlob,
  requestTTSAudio,
  speakWithWebSpeech,
} from '../../../services/tts';
import { ONBOARDING_VOICE_SETTINGS, ONBOARDING_WEB_SPEECH_SETTINGS } from './constants';

export function useOnboardingAudio(isAudioEnabled: boolean) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);

  const stopAllAudio = useCallback(() => {
    if (ttsAbortRef.current) {
      try {
        ttsAbortRef.current.abort();
      } catch {
        // noop
      }
      ttsAbortRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }

    setIsSpeaking(false);
  }, []);

  const speakText = useCallback(
    async (text: string) => {
      if (!isAudioEnabled || typeof window === 'undefined') {
        return;
      }

      stopAllAudio();
      setIsSpeaking(true);

      const controller = new AbortController();
      ttsAbortRef.current = controller;

      try {
        const blob = await requestTTSAudio(
          {
            text,
            voiceId: process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || DEFAULT_ELEVENLABS_VOICE_ID,
            modelId: DEFAULT_ELEVENLABS_MODEL_ID,
            voiceSettings: ONBOARDING_VOICE_SETTINGS,
            optimizeStreamingLatency: DEFAULT_TTS_OPTIMIZE_STREAMING_LATENCY,
            outputFormat: DEFAULT_TTS_OUTPUT_FORMAT,
          },
          controller.signal
        );

        if (controller.signal.aborted) {
          ttsAbortRef.current = null;
          return;
        }

        if (!blob) {
          speakWithWebSpeech(text, utteranceRef, ONBOARDING_WEB_SPEECH_SETTINGS, () => {
            setIsSpeaking(false);
          });
          ttsAbortRef.current = null;
          return;
        }

        ttsAbortRef.current = null;
        await playAudioBlob(blob, audioRef, {
          onFinish: () => {
            setIsSpeaking(false);
          },
        });
      } catch (error) {
        if (!isTTSAbortError(error)) {
          try {
            speakWithWebSpeech(text, utteranceRef, ONBOARDING_WEB_SPEECH_SETTINGS, () => {
              setIsSpeaking(false);
            });
            return;
          } catch {
            // fallback also failed
          }
        }

        setIsSpeaking(false);
      }
    },
    [isAudioEnabled, stopAllAudio]
  );

  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, [stopAllAudio]);

  return {
    isSpeaking,
    speakText,
    stopAllAudio,
  };
}
