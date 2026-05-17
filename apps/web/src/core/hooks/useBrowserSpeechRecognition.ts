"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BrowserSpeechRecognition, UseBrowserSpeechRecognitionParams, UseBrowserSpeechRecognitionResult } from "./browser-speech-recognition/browser-speech-recognition.types";
import {
  getMicrophoneNotAllowedMessage,
  getSpeechRecognitionStartErrorMessage,
  getSpeechRecognitionUnsupportedMessage,
} from "./browser-speech-recognition/browser-speech-recognition.messages";
import { stopSpeechRecognitionSafely } from "./browser-speech-recognition/browser-speech-recognition.utils";
import { useSpeechRecognitionLifecycle } from "./browser-speech-recognition/useSpeechRecognitionLifecycle";

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

  useSpeechRecognitionLifecycle({
    disabledRef,
    langRef,
    messagesRef,
    onTranscriptRef,
    pendingTimeoutRef,
    recognitionRef,
    setIsListening,
    setVoiceError,
  });

  const toggleListening = useCallback(async () => {
    if (disabledRef.current) {
      return;
    }

    const recognition = recognitionRef.current;

    if (!recognition) {
      setVoiceError(getSpeechRecognitionUnsupportedMessage(messagesRef.current));
      return;
    }

    if (isListening) {
      stopSpeechRecognitionSafely(recognition);
      setIsListening(false);
      return;
    }

    try {
      stopSpeechRecognitionSafely(recognition);
      recognition.lang = langRef.current;
      recognition.start();
      setVoiceError(null);
      setIsListening(true);
    } catch (error) {
      const typedError = error as Error;
      setIsListening(false);

      if (typedError.name === "NotAllowedError") {
        setVoiceError(getMicrophoneNotAllowedMessage(messagesRef.current, "retry"));
        return;
      }

      setVoiceError(getSpeechRecognitionStartErrorMessage(messagesRef.current));
    }
  }, [isListening]);

  return {
    isListening,
    setVoiceError,
    toggleListening,
    voiceError,
  };
}
