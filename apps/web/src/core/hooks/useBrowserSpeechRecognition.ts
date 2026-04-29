"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

interface BrowserSpeechRecognitionAlternative {
  transcript: string;
}

interface BrowserSpeechRecognitionResult {
  0: BrowserSpeechRecognitionAlternative;
  length: number;
}

interface BrowserSpeechRecognitionEvent {
  results: ArrayLike<BrowserSpeechRecognitionResult>;
}

interface BrowserSpeechRecognitionErrorEvent {
  error?: string;
}

interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: new () => BrowserSpeechRecognition;
  webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
}

interface UseBrowserSpeechRecognitionParams {
  disabled?: boolean;
  lang: string;
  messages?: {
    notAllowed: string;
    notSupported: string;
    startError: string;
  };
  onTranscript: (transcript: string) => void | Promise<void>;
}

interface UseBrowserSpeechRecognitionResult {
  isListening: boolean;
  setVoiceError: Dispatch<SetStateAction<string | null>>;
  toggleListening: () => Promise<void>;
  voiceError: string | null;
}

export function useBrowserSpeechRecognition({
  disabled = false,
  lang,
  messages,
  onTranscript,
}: UseBrowserSpeechRecognitionParams): UseBrowserSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const disabledRef = useRef(disabled);
  const langRef = useRef(lang);
  const messagesRef = useRef(messages);
  const onTranscriptRef = useRef(onTranscript);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const pendingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    langRef.current = lang;
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
    }
  }, [lang]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const speechWindow = window as SpeechRecognitionWindow;
    const SpeechRecognitionCtor =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      return undefined;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = langRef.current;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() || "";

      if (!transcript) {
        setIsListening(false);
        return;
      }

      if (pendingTimeoutRef.current) {
        window.clearTimeout(pendingTimeoutRef.current);
      }

      pendingTimeoutRef.current = window.setTimeout(() => {
        pendingTimeoutRef.current = null;
        setIsListening(false);

        if (!disabledRef.current) {
          void onTranscriptRef.current(transcript);
        }
      }, 250);
    };

    recognition.onerror = (event) => {
      try {
        recognition.stop();
      } catch {
        // SpeechRecognition can throw if stop races with browser cleanup.
      }

      setIsListening(false);

      if (event.error === "not-allowed") {
        setVoiceError(
          messagesRef.current?.notAllowed ||
            "Necesito permiso para usar el microfono. Habilita el acceso en tu navegador e intenta de nuevo."
        );
        return;
      }

      setVoiceError(
        messagesRef.current?.startError ||
          "No pude iniciar el dictado. Intenta nuevamente."
      );
    };

    recognitionRef.current = recognition;

    return () => {
      if (pendingTimeoutRef.current) {
        window.clearTimeout(pendingTimeoutRef.current);
        pendingTimeoutRef.current = null;
      }

      try {
        recognition.stop();
      } catch {
        // Ignore browser cleanup races.
      }

      recognitionRef.current = null;
    };
  }, []);

  const toggleListening = useCallback(async () => {
    if (disabledRef.current) {
      return;
    }

    const recognition = recognitionRef.current;

    if (!recognition) {
      setVoiceError(
        messagesRef.current?.notSupported ||
          "Tu navegador no soporta reconocimiento de voz. Usa Chrome, Edge o Safari."
      );
      return;
    }

    if (isListening) {
      try {
        recognition.stop();
      } catch {
        // Ignore browser stop races.
      }
      setIsListening(false);
      return;
    }

    try {
      try {
        recognition.stop();
      } catch {
        // Ensure a clean start when the browser keeps stale recognition state.
      }

      if (navigator.mediaDevices?.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      recognition.lang = langRef.current;
      recognition.start();
      setVoiceError(null);
      setIsListening(true);
    } catch (error) {
      const typedError = error as Error;
      setIsListening(false);

      if (typedError.name === "NotAllowedError") {
        setVoiceError(
          messagesRef.current?.notAllowed ||
            "Necesito permiso para usar el microfono. Permite el acceso y vuelve a intentar."
        );
        return;
      }

      setVoiceError(
        messagesRef.current?.startError ||
          "No pude iniciar el dictado. Intenta nuevamente."
      );
    }
  }, [isListening]);

  return {
    isListening,
    setVoiceError,
    toggleListening,
    voiceError,
  };
}
