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
 * `true` si el fallo de la voz en vivo proviene realmente de `getUserMedia`
 * (permiso de microfono denegado o sin dispositivo). Estos errores los resuelve
 * el usuario y NO deben disparar el fallback a dictado.
 */
function isMicPermissionError(rawError: string | null): boolean {
  if (!rawError) return false;
  const normalized = rawError.toLowerCase();
  return (
    normalized.includes('notallowed') ||
    normalized.includes('permission') ||
    normalized.includes('notfound') ||
    normalized.includes('permiso')
  );
}

/**
 * Traduce el codigo/mensaje crudo de la sesion de voz en vivo a un mensaje
 * accionable. Solo se culpa al permiso de microfono cuando el fallo proviene
 * realmente de `getUserMedia`; los fallos de token/servidor (502) NO son un
 * problema de permisos y deben mostrar un mensaje acorde.
 */
function resolveLiveVoiceErrorMessage(rawError: string | null): string | null {
  if (!rawError) return null;

  // Permiso de microfono denegado o sin dispositivo (errores de getUserMedia).
  if (isMicPermissionError(rawError)) {
    return 'Necesitamos acceso al microfono para hablar con SofLIA. Permitelo en tu navegador e intenta de nuevo.';
  }

  // Voz en vivo no configurada en el servidor (sin API key disponible).
  if (rawError.toLowerCase().includes('live_provider_unavailable')) {
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
  inputRef: RefObject<HTMLTextAreaElement>;
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

  // Fallback a dictado: si la voz en vivo (Live API) falla por algo que NO es
  // permiso de microfono (p. ej. la Live API esta bloqueada desde el servidor
  // en produccion), la marcamos como no disponible para esta sesion y la
  // entrada de voz pasa a usar dictado (Web Speech API). El TTS de SofLIA sigue
  // funcionando para las respuestas habladas.
  const [liveVoiceUnavailable, setLiveVoiceUnavailable] = useState(false);

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

  // Modo de entrada efectivo: voz en vivo solo si esta habilitada Y disponible.
  // En cuanto Live falla (no por permisos), se cae a dictado de forma sticky.
  const useLiveVoiceInput = isVoiceEnabled && !liveVoiceUnavailable;
  // Dictado como fallback de la voz en vivo no disponible en este entorno.
  const isDictationFallbackActive = isVoiceEnabled && liveVoiceUnavailable;

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
    // Habilitado cuando el dictado es el modo elegido, o como fallback cuando la
    // voz en vivo no esta disponible aunque el modo voz este activo.
    isDictationEnabled: (!isVoiceEnabled && isDictationEnabled) || isDictationFallbackActive,
    language,
    inputRef,
    setInputValue,
  });

  useEffect(() => {
    if (!isOpen || !isVoiceEnabled) {
      stopLiveVoice();
    }
  }, [isOpen, isVoiceEnabled, stopLiveVoice]);

  // Detecta el fallo de la voz en vivo y activa el fallback a dictado, salvo que
  // sea un problema de permisos de microfono (que el usuario debe resolver).
  useEffect(() => {
    if (liveVoiceStatus === 'error' && !isMicPermissionError(liveVoiceRawError)) {
      setLiveVoiceUnavailable(true);
    }
  }, [liveVoiceStatus, liveVoiceRawError]);

  const toggleVoiceInput = useCallback(async () => {
    if (useLiveVoiceInput) {
      dictation.stopDictation();
      await toggleLiveVoice();
      return;
    }

    dictation.toggleDictation();
  }, [dictation, useLiveVoiceInput, toggleLiveVoice]);

  const stopVoiceInput = useCallback(() => {
    if (useLiveVoiceInput) {
      stopLiveVoice();
      return;
    }

    dictation.stopDictation();
  }, [dictation, useLiveVoiceInput, stopLiveVoice]);

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

  // Cuando caemos a dictado, guiamos al usuario a usar el microfono. El aviso se
  // oculta apenas empieza a dictar o ya hay texto capturado, para no estorbar.
  const fallbackToDictationNotice =
    isDictationFallbackActive && !dictation.isDictating && !dictation.finalTranscript
      ? 'La voz en vivo no esta disponible aqui. Toca el microfono para dictar tu mensaje.'
      : null;

  const liveVoiceError = liveVoiceUnavailable
    ? fallbackToDictationNotice
    : resolveLiveVoiceErrorMessage(liveVoiceRawError);

  return {
    isSpeaking: isLiveVoiceActive ? isAssistantLiveSpeaking : isSpeaking,
    voiceReveal,
    isVoiceEnabled,
    toggleVoiceEnabled,
    isVoiceTogglePending,
    isDictationEnabled: isVoiceEnabled || isDictationEnabled,
    isDictating: useLiveVoiceInput ? isLiveVoiceActive : dictation.isDictating,
    isProcessingDictation: useLiveVoiceInput
      ? liveVoiceStatus === 'connecting'
      : dictation.isProcessingDictation,
    interimTranscript: useLiveVoiceInput ? '' : dictation.interimTranscript,
    finalTranscript: useLiveVoiceInput ? '' : dictation.finalTranscript,
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
