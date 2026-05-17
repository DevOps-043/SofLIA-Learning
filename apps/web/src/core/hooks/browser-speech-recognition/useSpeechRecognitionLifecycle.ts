"use client";

import { useEffect } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import {
  getMicrophoneNotAllowedMessage,
  getSpeechRecognitionStartErrorMessage,
} from "./browser-speech-recognition.messages";
import type {
  BrowserSpeechRecognition,
  BrowserSpeechRecognitionMessages,
  SpeechRecognitionWindow,
} from "./browser-speech-recognition.types";
import { stopSpeechRecognitionSafely } from "./browser-speech-recognition.utils";

interface SpeechRecognitionLifecycleConfig {
  disabledRef: MutableRefObject<boolean>;
  langRef: MutableRefObject<string>;
  messagesRef: MutableRefObject<BrowserSpeechRecognitionMessages | undefined>;
  onTranscriptRef: MutableRefObject<(transcript: string) => void | Promise<void>>;
  pendingTimeoutRef: MutableRefObject<number | null>;
  recognitionRef: MutableRefObject<BrowserSpeechRecognition | null>;
  setIsListening: Dispatch<SetStateAction<boolean>>;
  setVoiceError: Dispatch<SetStateAction<string | null>>;
}

export function useSpeechRecognitionLifecycle({
  disabledRef,
  langRef,
  messagesRef,
  onTranscriptRef,
  pendingTimeoutRef,
  recognitionRef,
  setIsListening,
  setVoiceError,
}: SpeechRecognitionLifecycleConfig) {
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
      stopSpeechRecognitionSafely(recognition);
      setIsListening(false);

      if (event.error === "not-allowed") {
        setVoiceError(getMicrophoneNotAllowedMessage(messagesRef.current));
        return;
      }

      setVoiceError(getSpeechRecognitionStartErrorMessage(messagesRef.current));
    };

    recognitionRef.current = recognition;

    return () => {
      if (pendingTimeoutRef.current) {
        window.clearTimeout(pendingTimeoutRef.current);
        pendingTimeoutRef.current = null;
      }

      stopSpeechRecognitionSafely(recognition);
      recognitionRef.current = null;
    };
  }, []);
}
