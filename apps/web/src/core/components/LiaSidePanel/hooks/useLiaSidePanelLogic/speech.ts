import { useCallback, useEffect } from 'react';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { SofLIAMessage } from '@/core/types/lia.types';
import type { SofLIAPersonalizationSettings } from '@/core/types/soflia-personalization.types';
import { useLiaLiveVoice } from '../../../lia-live/useLiaLiveVoice';
import { useLiaSidePanelDictation } from '../useLiaSidePanelDictation';
import { useLiaSidePanelVoice } from '../useLiaSidePanelVoice';

interface UseLiaSidePanelSpeechParams {
  messages: SofLIAMessage[];
  isLoading: boolean;
  isOpen: boolean;
  language: string;
  pageContext: Record<string, unknown> | null;
  currentConversationId: string | null;
  settings: SofLIAPersonalizationSettings | null | undefined;
  inputRef: RefObject<HTMLInputElement>;
  setInputValue: Dispatch<SetStateAction<string>>;
}

export function useLiaSidePanelSpeech({
  messages,
  isLoading,
  isOpen,
  language,
  pageContext,
  currentConversationId,
  settings,
  inputRef,
  setInputValue,
}: UseLiaSidePanelSpeechParams) {
  const isVoiceEnabled = settings?.voice_enabled ?? true;
  const isDictationEnabled = settings?.dictation_enabled ?? false;

  const liveVoice = useLiaLiveVoice({
    conversationId: currentConversationId,
    contextType: pageContext?.currentLessonContext ? 'course' : 'general',
    pageContext,
    language,
    source: 'side_panel',
  });
  const {
    status: liveVoiceStatus,
    error: liveVoiceRawError,
    isAssistantSpeaking: isAssistantLiveSpeaking,
    toggle: toggleLiveVoice,
    stop: stopLiveVoice,
    clearError: clearLiveVoiceError,
  } = liveVoice;
  const isLiveVoiceActive = liveVoiceStatus === 'connecting' || liveVoiceStatus === 'live';

  const { isSpeaking, voiceReveal } = useLiaSidePanelVoice({
    messages,
    isLoading,
    isOpen,
    isVoiceEnabled: isVoiceEnabled && !isLiveVoiceActive,
    language,
    settings,
  });
  const dictation = useLiaSidePanelDictation({
    isOpen,
    isDictationEnabled: !isVoiceEnabled && isDictationEnabled,
    language,
    inputRef,
    setInputValue,
  });

  useEffect(() => {
    if (!isOpen || !isVoiceEnabled) {
      stopLiveVoice();
    }
  }, [isOpen, isVoiceEnabled, stopLiveVoice]);

  const toggleVoiceInput = useCallback(async () => {
    if (isVoiceEnabled) {
      dictation.stopDictation();
      await toggleLiveVoice();
      return;
    }

    dictation.toggleDictation();
  }, [dictation, isVoiceEnabled, toggleLiveVoice]);

  const stopVoiceInput = useCallback(() => {
    if (isVoiceEnabled) {
      stopLiveVoice();
      return;
    }

    dictation.stopDictation();
  }, [dictation, isVoiceEnabled, stopLiveVoice]);

  const setVoiceInputError = useCallback(
    (value: string | null) => {
      dictation.setDictationError(value);
      if (value === null) {
        clearLiveVoiceError();
      }
    },
    [clearLiveVoiceError, dictation],
  );

  const liveVoiceError = liveVoiceRawError
    ? 'No se pudo iniciar la voz en vivo. Verifica permisos de microfono e intenta de nuevo.'
    : null;

  return {
    isSpeaking: isLiveVoiceActive ? isAssistantLiveSpeaking : isSpeaking,
    voiceReveal,
    isVoiceEnabled,
    isDictationEnabled: isVoiceEnabled || isDictationEnabled,
    isDictating: isVoiceEnabled ? isLiveVoiceActive : dictation.isDictating,
    isProcessingDictation: isVoiceEnabled
      ? liveVoiceStatus === 'connecting'
      : dictation.isProcessingDictation,
    interimTranscript: isVoiceEnabled ? '' : dictation.interimTranscript,
    finalTranscript: isVoiceEnabled ? '' : dictation.finalTranscript,
    dictationError: dictation.dictationError || liveVoiceError,
    setDictationError: setVoiceInputError,
    toggleDictation: toggleVoiceInput,
    stopDictation: stopVoiceInput,
    liveVoiceStatus,
    isLiveVoiceActive,
    isAssistantLiveSpeaking,
    liveVoiceError,
    stopLiveVoice,
  };
}
