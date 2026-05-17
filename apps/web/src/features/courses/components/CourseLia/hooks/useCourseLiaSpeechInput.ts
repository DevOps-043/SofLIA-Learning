import type { Dispatch, RefObject, SetStateAction } from 'react';

import { useBrowserSpeechRecognition } from '@/core/hooks/useBrowserSpeechRecognition';

interface UseCourseLiaSpeechInputArgs {
  inputRef: RefObject<HTMLTextAreaElement>;
  isLoading: boolean;
  language: string;
  setInputValue: Dispatch<SetStateAction<string>>;
  t: (key: string) => string;
}

export function useCourseLiaSpeechInput({
  inputRef,
  isLoading,
  language,
  setInputValue,
  t,
}: UseCourseLiaSpeechInputArgs) {
  const speechRecognitionLang =
    language === 'en' ? 'en-US' : language === 'pt' ? 'pt-BR' : 'es-ES';

  return useBrowserSpeechRecognition({
    disabled: isLoading,
    lang: speechRecognitionLang,
    messages: {
      notAllowed: t('lia.voice.permissionError'),
      notSupported: t('lia.voice.notSupported'),
      startError: t('lia.voice.startError'),
    },
    onTranscript: (transcript) => {
      setInputValue((currentValue) => {
        const trimmedCurrent = currentValue.trim();
        return trimmedCurrent ? `${trimmedCurrent} ${transcript}` : transcript;
      });
      inputRef.current?.focus();
    },
  });
}
