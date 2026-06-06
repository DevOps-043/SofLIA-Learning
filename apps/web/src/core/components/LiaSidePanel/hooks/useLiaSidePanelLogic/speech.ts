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

/**
 * Traduce el codigo/mensaje crudo de la sesion de voz en vivo a un mensaje
 * accionable. Solo se culpa al permiso de microfono cuando el fallo proviene
 * realmente de `getUserMedia`; los fallos de token/servidor (502) NO son un
 * problema de permisos y deben mostrar un mensaje acorde.
 */
function resolveLiveVoiceErrorMessage(rawError: string | null): string | null {
  if (!rawError) return null;

  const normalized = rawError.toLowerCase();

  // Permiso de microfono denegado o sin dispositivo (errores de getUserMedia).
  if (
    normalized.includes('notallowed') ||
    normalized.includes('permission') ||
    normalized.includes('notfound') ||
    normalized.includes('permiso')
  ) {
    return 'Necesitamos acceso al microfono para hablar con SofLIA. Permitelo en tu navegador e intenta de nuevo.';
  }

  // Voz en vivo no configurada en el servidor (sin API key disponible).
  if (normalized.includes('live_provider_unavailable')) {
    return 'La voz en vivo no esta disponible por ahora. Intenta mas tarde.';
  }

  // Fallo de token (502) o de sesion: problema del servicio, no del microfono.
  return 'No se pudo iniciar la voz en vivo. Intentalo de nuevo en un momento.';
}

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

  const liveVoiceError = resolveLiveVoiceErrorMessage(liveVoiceRawError);

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
