'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSofLIAPersonalization } from '../../../hooks/useSofLIAPersonalization';
import { getElevenLabsVoiceSettings, getWebSpeechVoiceSettings } from '../../../utils/tts-voice-settings';
import { isTTSAbortError, playAudioBlob, requestTTSAudio, speakWithWebSpeech } from '../../../services/tts';

interface SpeechErrorEvent { error: string }
interface SpeechResultEvent { results: Array<Array<{ transcript: string }>> }
interface BrowserSpeechRecognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onerror: ((event: SpeechErrorEvent) => void) | null
  onend: (() => void) | null
  onresult: ((event: SpeechResultEvent) => void) | null
}

interface BrowserSpeechRecognitionConstructor {
  new (): BrowserSpeechRecognition
}

const SPEECH_LANGUAGE_MAP: Record<string, string> = {
  es: 'es-ES',
  en: 'en-US',
  pt: 'pt-BR',
};

export interface UseAIChatVoiceReturn {
  isSpeaking: boolean;
  isRecording: boolean;
  isVoiceEnabled: boolean;
  stopAllAudio: () => void;
  speakText: (text: string) => Promise<void>;
  toggleRecording: (onTranscript?: (text: string) => void) => Promise<void>;
}

export function useAIChatVoice(language: string, tCommon: (key: string) => string): UseAIChatVoiceReturn {
  const { settings: liaSettings } = useSofLIAPersonalization();
  const isVoiceEnabled = liaSettings?.voice_enabled ?? true;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  const stopAllAudio = useCallback(() => {
    try {
      if (ttsAbortRef.current) {
        try { ttsAbortRef.current.abort(); } catch { /* ignore */ }
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

  useEffect(() => {
    return () => { stopAllAudio(); };
  }, [stopAllAudio]);

  const cleanTextForTTS = useCallback((text: string): string => {
    if (!text) return text;
    let cleaned = text;
    cleaned = cleaned.replace(/```[\w]*\n?[\s\S]*?```/g, '');
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
    cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
    cleaned = cleaned.replace(/([^*\n])\*([^*\n]+)\*([^*\n])/g, '$1$2$3');
    cleaned = cleaned.replace(/([^_\n])_([^_\n]+)_([^_\n])/g, '$1$2$3');
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
    cleaned = cleaned.replace(/^>\s+/gm, '');
    cleaned = cleaned.replace(/^[-*]{3,}$/gm, '');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.replace(/[ \t]+/g, ' ');
    return cleaned.trim();
  }, []);

  const speakText = useCallback(async (text: string) => {
    if (!isVoiceEnabled || typeof window === 'undefined') return;

    const cleanedText = cleanTextForTTS(text);
    if (!cleanedText || cleanedText.trim().length === 0) return;

    stopAllAudio();

    try {
      setIsSpeaking(true);

      const webSpeechSettings = getWebSpeechVoiceSettings(liaSettings);
      const elevenLabsSettings = getElevenLabsVoiceSettings(liaSettings);
      const controller = new AbortController();
      ttsAbortRef.current = controller;

      const audioBlob = await requestTTSAudio(
        {
          text: cleanedText,
          voiceSettings: elevenLabsSettings,
        },
        controller.signal
      );

      if (ttsAbortRef.current && ttsAbortRef.current.signal.aborted) {
        ttsAbortRef.current = null;
        return;
      }

      if (!audioBlob) {
        speakWithWebSpeech(
          cleanedText,
          utteranceRef,
          {
            lang: SPEECH_LANGUAGE_MAP[language] || 'es-ES',
            ...webSpeechSettings,
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

      if (ttsAbortRef.current === controller) ttsAbortRef.current = null;
    } catch (error: unknown) {
      if (!isTTSAbortError(error)) {
        console.error('Error en sÃ­ntesis de voz con ElevenLabs:', error);
      }
      setIsSpeaking(false);
    }
  }, [isVoiceEnabled, language, stopAllAudio, cleanTextForTTS, liaSettings]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const speechWindow = window as Window & {
      SpeechRecognition?: BrowserSpeechRecognitionConstructor
      webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor
    };
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = SPEECH_LANGUAGE_MAP[language] || 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onerror = (event: SpeechErrorEvent) => {
      console.warn('Speech recognition error:', event.error);
      setIsRecording(false);
      if (event.error === 'not-allowed') {
        alert(tCommon('aiChat.voice.microphoneError'));
      }
    };

    recognition.onend = () => { setIsRecording(false); };

    recognitionRef.current = recognition;

    return () => {
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    };
  }, [language, tCommon]);

  const toggleRecording = useCallback(async (onTranscript?: (text: string) => void) => {
    if (!recognitionRef.current) {
      alert(tCommon('aiChat.voice.speechNotSupported'));
      return;
    }

    if (isRecording) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      setIsRecording(false);
    } else {
      try {
        stopAllAudio();
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current.lang = SPEECH_LANGUAGE_MAP[language] || 'es-ES';

        recognitionRef.current.onresult = (event: SpeechResultEvent) => {
          const transcript = event.results[0][0].transcript;
          if (transcript.trim() && onTranscript) {
            onTranscript(transcript);
          }
          setIsRecording(false);
        };

        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error: unknown) {
        console.error('Error starting speech recognition:', error);
        setIsRecording(false);
        if (error instanceof Error && error.name === 'NotAllowedError') {
          alert(tCommon('aiChat.voice.microphoneError'));
        }
      }
    }
  }, [isRecording, language, tCommon, stopAllAudio]);

  return { isSpeaking, isRecording, isVoiceEnabled, stopAllAudio, speakText, toggleRecording };
}
