import { useCallback, useEffect, useState } from 'react';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { SofLIAMessage } from '@/core/types/lia.types';
import type {
  SofLIAPersonalizationSettings,
  SofLIAPersonalizationSettingsInput,
} from '@/core/types/soflia-personalization.types';
import { useLiaSidePanelDictation } from '../useLiaSidePanelDictation';
import { useLiaSidePanelVoice } from '../useLiaSidePanelVoice';
import { useLiaTurnVoice } from '../useLiaTurnVoice';

interface UseLiaSidePanelSpeechParams {
  messages: SofLIAMessage[];
  isLoading: boolean;
  isOpen: boolean;
  language: string;
  pageContext: Record<string, unknown> | null;
  settings: SofLIAPersonalizationSettings | null | undefined;
  updateSettings: (input: SofLIAPersonalizationSettingsInput) => Promise<void>;
  inputRef: RefObject<HTMLTextAreaElement>;
  setInputValue: Dispatch<SetStateAction<string>>;
  sendMessage: (
    message: string,
    isSystemMessage?: boolean,
    pageContext?: Record<string, unknown>,
  ) => Promise<void>;
}

export function useLiaSidePanelSpeech({
  messages,
  isLoading,
  isOpen,
  language,
  pageContext,
  settings,
  updateSettings,
  inputRef,
  setInputValue,
  sendMessage,
}: UseLiaSidePanelSpeechParams) {
  const isVoiceEnabled = settings?.voice_enabled ?? true;
  const isDictationEnabled = settings?.dictation_enabled ?? false;
  const [isVoiceTogglePending, setIsVoiceTogglePending] = useState(false);

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

  const turnVoice = useLiaTurnVoice({
    enabled: isVoiceEnabled,
    isOpen,
    language,
    messages,
    isLoading,
    isSpeaking,
    voiceReveal,
    pageContext,
    sendMessage,
  });

  useEffect(() => {
    if (!isOpen || !isVoiceEnabled) {
      turnVoice.stop();
    }
  }, [isOpen, isVoiceEnabled, turnVoice.stop]);

  const setVoiceInputError = useCallback(
    (value: string | null) => {
      dictation.setDictationError(value);
      if (value === null) {
        turnVoice.clearError();
      }
    },
    [dictation, turnVoice],
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
        turnVoice.stop();
        dictation.stopDictation();
      }
      await updateSettings({ voice_enabled: next });
    } catch {
      // El hook de personalización conserva el valor previo si la petición falla.
    } finally {
      setIsVoiceTogglePending(false);
    }
  }, [dictation, isVoiceEnabled, isVoiceTogglePending, turnVoice, updateSettings]);

  return {
    isSpeaking,
    voiceReveal,
    isVoiceEnabled,
    toggleVoiceEnabled,
    isVoiceTogglePending,
    isDictationEnabled,
    isDictating: dictation.isDictating,
    isProcessingDictation: dictation.isProcessingDictation,
    interimTranscript: dictation.interimTranscript,
    finalTranscript: dictation.finalTranscript,
    dictationError: dictation.dictationError || turnVoice.error,
    setDictationError: setVoiceInputError,
    toggleDictation: dictation.toggleDictation,
    stopDictation: dictation.stopDictation,
    liveVoiceStatus: turnVoice.status,
    isLiveVoiceActive: turnVoice.isActive,
    isAssistantLiveSpeaking: turnVoice.isAssistantSpeaking,
    liveVoiceError: turnVoice.error,
    toggleLiveVoice: turnVoice.toggle,
    stopLiveVoice: turnVoice.stop,
  };
}
