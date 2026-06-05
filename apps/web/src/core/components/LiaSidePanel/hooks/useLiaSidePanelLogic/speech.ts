import { useCallback, useEffect, useState } from 'react';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { SofLIAMessage } from '@/core/types/lia.types';
import type {
  SofLIAPersonalizationSettings,
  SofLIAPersonalizationSettingsInput,
} from '@/core/types/soflia-personalization.types';
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
  updateSettings: (input: SofLIAPersonalizationSettingsInput) => Promise<void>;
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
  updateSettings,
  inputRef,
  setInputValue,
}: UseLiaSidePanelSpeechParams) {
  const isVoiceEnabled = settings?.voice_enabled ?? true;
  const isDictationEnabled = settings?.dictation_enabled ?? false;
  const [isVoiceTogglePending, setIsVoiceTogglePending] = useState(false);

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

  // Activa/desactiva el modo de voz (TTS) persistiendo `voice_enabled`.
  // Permite alternarlo desde el header sin abrir Personalización.
  const toggleVoiceEnabled = useCallback(async () => {
    if (isVoiceTogglePending) return;
    const next = !isVoiceEnabled;
    setIsVoiceTogglePending(true);
    try {
      // Al apagar la voz, corta de inmediato cualquier sesión de voz en vivo
      // o dictado en curso para que la UI quede consistente con el ajuste.
      if (!next) {
        stopLiveVoice();
        dictation.stopDictation();
      }
      await updateSettings({ voice_enabled: next });
    } catch {
      // El hook de personalización conserva el valor previo si la petición falla.
    } finally {
      setIsVoiceTogglePending(false);
    }
  }, [dictation, isVoiceEnabled, isVoiceTogglePending, stopLiveVoice, updateSettings]);

  const liveVoiceError = liveVoiceRawError
    ? 'No se pudo iniciar la voz en vivo. Verifica permisos de microfono e intenta de nuevo.'
    : null;

  return {
    isSpeaking: isLiveVoiceActive ? isAssistantLiveSpeaking : isSpeaking,
    voiceReveal,
    isVoiceEnabled,
    toggleVoiceEnabled,
    isVoiceTogglePending,
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
