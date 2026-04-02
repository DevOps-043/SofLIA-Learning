'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { SofLIAMessage } from '../../../types/lia.types';
import type { SofLIAPersonalizationSettings } from '../../../types/soflia-personalization.types';
import { getElevenLabsVoiceSettings, getWebSpeechVoiceSettings } from '../../../utils/tts-voice-settings';
import { isTTSAbortError, playAudioBlob, requestTTSAudio, speakWithWebSpeech } from '../../../services/tts';
import { cleanTextForLiaTTS, getLiaSpeechLanguage } from '../services/lia-side-panel-voice.service';

interface UseLiaSidePanelVoiceOptions {
  messages: SofLIAMessage[];
  isLoading: boolean;
  isOpen: boolean;
  isVoiceEnabled: boolean;
  language: string;
  settings: SofLIAPersonalizationSettings | null | undefined;
}

export function useLiaSidePanelVoice({
  messages,
  isLoading,
  isOpen,
  isVoiceEnabled,
  language,
  settings,
}: UseLiaSidePanelVoiceOptions) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const lastReadMessageIdRef = useRef<string | null>(null);

  const stopAllAudio = useCallback(() => {
    try {
      if (ttsAbortRef.current) {
        try {
          ttsAbortRef.current.abort();
        } catch {
          // ignore
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
    } catch {
      // ignore
    }
  }, []);

  const speakText = useCallback(
    async (text: string) => {
      if (!isVoiceEnabled || typeof window === 'undefined') {
        return;
      }

      const cleanedText = cleanTextForLiaTTS(text);
      if (!cleanedText) {
        return;
      }

      stopAllAudio();

      try {
        setIsSpeaking(true);

        const controller = new AbortController();
        ttsAbortRef.current = controller;

        const audioBlob = await requestTTSAudio(
          {
            text: cleanedText,
            voiceSettings: getElevenLabsVoiceSettings(settings),
          },
          controller.signal
        );

        if (ttsAbortRef.current?.signal.aborted) {
          ttsAbortRef.current = null;
          return;
        }

        if (!audioBlob) {
          speakWithWebSpeech(
            cleanedText,
            utteranceRef,
            {
              lang: getLiaSpeechLanguage(language),
              ...getWebSpeechVoiceSettings(settings),
            },
            () => setIsSpeaking(false)
          );

          if (ttsAbortRef.current === controller) {
            ttsAbortRef.current = null;
          }

          return;
        }

        await playAudioBlob(audioBlob, audioRef, {
          onFinish: () => setIsSpeaking(false),
        });

        if (ttsAbortRef.current === controller) {
          ttsAbortRef.current = null;
        }
      } catch (error) {
        if (!isTTSAbortError(error)) {
          console.error('Error en sintesis de voz con ElevenLabs:', error);
        }
        setIsSpeaking(false);
      }
    },
    [isVoiceEnabled, language, settings, stopAllAudio]
  );

  useEffect(() => {
    if (!isVoiceEnabled || messages.length === 0 || isLoading) {
      return;
    }

    const lastAssistantMessage = [...messages].reverse().find(
      (message) =>
        message.role === 'assistant' &&
        message.id !== lastReadMessageIdRef.current &&
        message.content.trim().length > 0
    );

    if (!lastAssistantMessage) {
      return;
    }

    const timer = setTimeout(() => {
      speakText(lastAssistantMessage.content);
      lastReadMessageIdRef.current = lastAssistantMessage.id;
    }, 1000);

    return () => clearTimeout(timer);
  }, [messages, isVoiceEnabled, isLoading, speakText]);

  useEffect(() => {
    if (!isOpen) {
      stopAllAudio();
    }

    return () => {
      stopAllAudio();
    };
  }, [isOpen, stopAllAudio]);

  return {
    isSpeaking,
    speakText,
    stopAllAudio,
  };
}
