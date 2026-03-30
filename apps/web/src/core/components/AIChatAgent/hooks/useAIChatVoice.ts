'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSofLIAPersonalization } from '../../../hooks/useSofLIAPersonalization';
import { getElevenLabsVoiceSettings, getWebSpeechVoiceSettings } from '../../../utils/tts-voice-settings';

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
  const recognitionRef = useRef<any>(null);

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

      const apiKey = 'sk_dd0d1757269405cd26d5e22fb14c54d2f49c4019fd8e86d0';
      const voiceId = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 'ay4iqk10DLwc8KGSrf2t';
      const modelId = 'eleven_turbo_v2_5';

      const webSpeechSettings = getWebSpeechVoiceSettings(liaSettings);
      const elevenLabsSettings = getElevenLabsVoiceSettings(liaSettings);

      if (!apiKey || !voiceId) {
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        utterance.lang = SPEECH_LANGUAGE_MAP[language] || 'es-ES';
        utterance.rate = webSpeechSettings.rate;
        utterance.pitch = webSpeechSettings.pitch;
        utterance.volume = webSpeechSettings.volume;
        utterance.onend = () => { setIsSpeaking(false); utteranceRef.current = null; };
        utterance.onerror = () => { setIsSpeaking(false); utteranceRef.current = null; };
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        return;
      }

      const controller = new AbortController();
      ttsAbortRef.current = controller;

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          signal: controller.signal,
          method: 'POST',
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            text: cleanedText,
            model_id: modelId,
            voice_settings: elevenLabsSettings,
            optimize_streaming_latency: 4,
            output_format: 'mp3_22050_32',
          }),
        }
      );

      if (!response.ok) throw new Error(`ElevenLabs API error: ${response.status}`);

      const audioBlob = await response.blob();
      if (ttsAbortRef.current && ttsAbortRef.current.signal.aborted) {
        ttsAbortRef.current = null;
        return;
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.volume = 0.8;
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        if (audioRef.current === audio) audioRef.current = null;
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        if (audioRef.current === audio) audioRef.current = null;
      };

      try {
        await audio.play();
        if (ttsAbortRef.current === controller) ttsAbortRef.current = null;
      } catch {
        setIsSpeaking(false);
      }
    } catch (error: any) {
      if (!(error?.name === 'AbortError' || error?.message?.includes('aborted'))) {
        console.error('Error en síntesis de voz con ElevenLabs:', error);
      }
      setIsSpeaking(false);
    }
  }, [isVoiceEnabled, language, stopAllAudio, cleanTextForTTS, liaSettings]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = SPEECH_LANGUAGE_MAP[language] || 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onerror = (event: any) => {
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

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript.trim() && onTranscript) {
            onTranscript(transcript);
          }
          setIsRecording(false);
        };

        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error: any) {
        console.error('Error starting speech recognition:', error);
        setIsRecording(false);
        if (error?.name === 'NotAllowedError') {
          alert(tCommon('aiChat.voice.microphoneError'));
        }
      }
    }
  }, [isRecording, language, tCommon, stopAllAudio]);

  return { isSpeaking, isRecording, isVoiceEnabled, stopAllAudio, speakText, toggleRecording };
}
