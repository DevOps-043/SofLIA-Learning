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

function extractTranscript(event: { results: ArrayLike<{ 0?: { transcript?: string } }> }) {
  const parts: string[] = [];

  for (let index = 0; index < event.results.length; index += 1) {
    const transcript = event.results[index]?.[0]?.transcript?.trim();
    if (transcript) {
      parts.push(transcript);
    }
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
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
      const transcript = extractTranscript(event);

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

      // These are normal lifecycle events — not user-visible errors.
      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setVoiceError(getMicrophoneNotAllowedMessage(messagesRef.current));
        return;
      }

      setVoiceError(getSpeechRecognitionStartErrorMessage(messagesRef.current));
    };

    recognition.onend = () => {
      if (!pendingTimeoutRef.current) {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (pendingTimeoutRef.current) {
        window.clearTimeout(pendingTimeoutRef.current);
        pendingTimeoutRef.current = null;
      }

      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      stopSpeechRecognitionSafely(recognition);
      recognitionRef.current = null;
    };
  }, []);
}
