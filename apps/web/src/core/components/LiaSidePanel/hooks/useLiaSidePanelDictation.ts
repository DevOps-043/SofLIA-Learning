'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import { getLiaSpeechLanguage } from '../services/lia-side-panel-voice.service';

interface UseLiaSidePanelDictationOptions {
  isOpen: boolean;
  isDictationEnabled: boolean;
  language: string;
  inputRef: RefObject<HTMLInputElement>;
  setInputValue: Dispatch<SetStateAction<string>>;
}

type SpeechRecognitionErrorCode =
  | 'aborted'
  | 'audio-capture'
  | 'network'
  | 'no-speech'
  | 'not-allowed'
  | string;

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike extends ArrayLike<SpeechRecognitionAlternativeLike> {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
}

interface SpeechResultEvent {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechErrorEvent {
  error: SpeechRecognitionErrorCode;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

function focusInputAtEnd(inputRef: RefObject<HTMLInputElement>) {
  setTimeout(() => {
    inputRef.current?.focus();
    if (inputRef.current) {
      const position = inputRef.current.value.length;
      inputRef.current.setSelectionRange(position, position);
    }
  }, 50);
}

export function useLiaSidePanelDictation({
  isOpen,
  isDictationEnabled,
  language,
  inputRef,
  setInputValue,
}: UseLiaSidePanelDictationOptions) {
  const [isDictating, setIsDictating] = useState(false);
  const [isProcessingDictation, setIsProcessingDictation] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dictationTextToApplyRef = useRef('');

  const stopDictation = useCallback(() => {
    setFinalTranscript((currentFinal) => {
      setInterimTranscript((currentInterim) => {
        dictationTextToApplyRef.current = `${currentFinal} ${currentInterim}`.trim();
        return '';
      });
      return '';
    });

    setIsDictating(false);

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    const textToApply = dictationTextToApplyRef.current;
    if (!textToApply) {
      dictationTextToApplyRef.current = '';
      setIsProcessingDictation(false);
      return;
    }

    setIsProcessingDictation(true);

    setTimeout(() => {
      setInputValue((previousValue) => {
        const nextValue = previousValue ? `${previousValue} ${textToApply}` : textToApply;
        return nextValue;
      });

      dictationTextToApplyRef.current = '';
      focusInputAtEnd(inputRef);
      setIsProcessingDictation(false);
    }, 0);
  }, [inputRef, setInputValue]);

  const toggleDictation = useCallback(async () => {
    if (!isDictationEnabled) {
      console.warn('Dictado no esta habilitado en la configuracion');
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const recognitionWindow = window as SpeechRecognitionWindow;
    const SpeechRecognition =
      recognitionWindow.SpeechRecognition ?? recognitionWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz. Por favor, usa Chrome, Edge o Safari.');
      return;
    }

    if (isDictating) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      stopDictation();
      return;
    }

    try {
      setInterimTranscript('');
      setFinalTranscript('');
      setIsProcessingDictation(false);

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = getLiaSpeechLanguage(language);
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      const resetSilenceTimeout = () => {
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }

        silenceTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch {
              // ignore
            }
          }
          stopDictation();
        }, 3000);
      };

      recognition.onresult = (event: SpeechResultEvent) => {
        let nextInterim = '';
        let nextFinal = '';
        let hasNewText = false;

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const transcript = event.results[index][0].transcript;

          if (event.results[index].isFinal) {
            nextFinal += `${transcript} `;
            hasNewText = true;
          } else {
            nextInterim += transcript;
            hasNewText = true;
          }
        }

        if (hasNewText) {
          resetSilenceTimeout();
        }

        if (nextFinal) {
          setFinalTranscript((previousValue) => `${previousValue} ${nextFinal}`.trim());
        }
        setInterimTranscript(nextInterim);
      };

      recognition.onend = () => {
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        stopDictation();
      };

      recognition.onerror = (event: SpeechErrorEvent) => {
        console.error('Error en reconocimiento de voz:', event.error);
        if (event.error === 'no-speech') {
          stopDictation();
          return;
        }

        if (event.error === 'audio-capture') {
          alert('No se pudo acceder al microfono. Por favor, verifica los permisos.');
          stopDictation();
          return;
        }

        if (event.error === 'not-allowed') {
          alert('Permiso de microfono denegado. Por favor, permite el acceso al microfono.');
          stopDictation();
          return;
        }

        if (event.error === 'network' || event.error === 'aborted') {
          stopDictation();
        }
      };

      recognition.onstart = () => {
        setIsDictating(true);
        resetSilenceTimeout();
      };

      recognition.start();
    } catch (error: unknown) {
      console.error('Error iniciando dictado:', error);
      setIsDictating(false);
      setIsProcessingDictation(false);

      const errorName = error instanceof Error ? error.name : '';
      const errorMessage = error instanceof Error ? error.message : '';

      if (errorName === 'NotAllowedError' || errorMessage.includes('not allowed')) {
        alert(
          'Se necesita permiso para usar el microfono. Por favor, permite el acceso al microfono en la configuracion del navegador.'
        );
        return;
      }

      if (errorMessage.includes('already started')) {
        setIsDictating(true);
        return;
      }

      alert('Error al acceder al microfono. Por favor, verifica que tu navegador soporte reconocimiento de voz.');
    }
  }, [isDictationEnabled, isDictating, language, stopDictation]);

  useEffect(() => {
    if (!isOpen) {
      stopDictation();
    }

    return () => {
      stopDictation();
    };
  }, [isOpen, stopDictation]);

  return {
    isDictating,
    isProcessingDictation,
    interimTranscript,
    finalTranscript,
    toggleDictation,
    stopDictation,
  };
}
