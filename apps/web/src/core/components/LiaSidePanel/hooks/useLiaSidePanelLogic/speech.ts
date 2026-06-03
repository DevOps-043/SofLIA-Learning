import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { SofLIAMessage } from '@/core/types/lia.types';
import type { SofLIAPersonalizationSettings } from '@/core/types/soflia-personalization.types';
import { useLiaSidePanelDictation } from '../useLiaSidePanelDictation';
import { useLiaSidePanelVoice } from '../useLiaSidePanelVoice';

interface UseLiaSidePanelSpeechParams {
  messages: SofLIAMessage[];
  isLoading: boolean;
  isOpen: boolean;
  language: string;
  settings: SofLIAPersonalizationSettings | null | undefined;
  inputRef: RefObject<HTMLInputElement>;
  setInputValue: Dispatch<SetStateAction<string>>;
}

export function useLiaSidePanelSpeech({
  messages,
  isLoading,
  isOpen,
  language,
  settings,
  inputRef,
  setInputValue,
}: UseLiaSidePanelSpeechParams) {
  const isVoiceEnabled = settings?.voice_enabled ?? true;
  const isDictationEnabled = settings?.dictation_enabled ?? false;
  const { isSpeaking, voiceReveal } = useLiaSidePanelVoice({
    messages,
    isLoading,
    isOpen,
    isVoiceEnabled,
    language,
    settings,
  });
  const dictation = useLiaSidePanelDictation({
    isOpen,
    isDictationEnabled,
    language,
    inputRef,
    setInputValue,
  });

  return { isSpeaking, voiceReveal, isVoiceEnabled, isDictationEnabled, ...dictation };
}
