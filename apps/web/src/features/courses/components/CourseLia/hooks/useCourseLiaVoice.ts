import { useCallback, useEffect } from 'react';

import { useSofLIAVoiceToggle } from '@/core/hooks/useSofLIAVoiceToggle';
import { useStreamingChatVoice } from '@/core/hooks/useStreamingChatVoice';
import type { UseLiaCourseChatReturn } from '@/core/hooks/useLiaCourseChat';
import type { SofLIAMessage } from '@/core/types/lia.types';

interface UseCourseLiaVoiceArgs {
  messages: SofLIAMessage[];
  isLoading: boolean;
  isOpen: boolean;
  sendMessage: UseLiaCourseChatReturn['sendMessage'];
  editMessageAndRegenerate: UseLiaCourseChatReturn['editMessageAndRegenerate'];
  stop: UseLiaCourseChatReturn['stop'];
}

/**
 * Voz de salida (TTS en streaming) para SofLIA dentro de los cursos. Misma
 * arquitectura que el panel embebido y el panel lateral: `useStreamingChatVoice`
 * locuta cada oración apenas se completa en la transmisión, y la voz se "arma"
 * justo antes de cada envío para locutar SOLO respuestas presenciadas (nunca el
 * saludo estático ni el historial cargado).
 *
 * Devuelve wrappers con la MISMA firma que las acciones del chat para que el
 * controller los sustituya sin tocar a los consumidores:
 * - `sendMessageWithVoice` / `editMessageAndRegenerateWithVoice`: arman la voz
 *   y delegan. Cubren todos los caminos de envío (input, sugerencias, edición,
 *   mensaje de bienvenida de actividad).
 * - `stopWithVoice`: corta generación Y locución a la vez (botón detener,
 *   bloqueo de interacción).
 */
export function useCourseLiaVoice({
  messages,
  isLoading,
  isOpen,
  sendMessage,
  editMessageAndRegenerate,
  stop,
}: UseCourseLiaVoiceArgs) {
  const { isVoiceEnabled, isVoiceTogglePending, toggleVoiceEnabled } = useSofLIAVoiceToggle();
  const {
    armForNextResponse,
    stop: stopVoice,
    isSpeaking,
  } = useStreamingChatVoice({ messages, isLoading });

  const sendMessageWithVoice = useCallback<UseLiaCourseChatReturn['sendMessage']>(
    (message, courseContext, workshopContext, isSystemMessage) => {
      armForNextResponse();
      return sendMessage(message, courseContext, workshopContext, isSystemMessage);
    },
    [armForNextResponse, sendMessage],
  );

  const editMessageAndRegenerateWithVoice = useCallback<
    UseLiaCourseChatReturn['editMessageAndRegenerate']
  >(
    (messageId, message, courseContext, workshopContext) => {
      armForNextResponse();
      return editMessageAndRegenerate(messageId, message, courseContext, workshopContext);
    },
    [armForNextResponse, editMessageAndRegenerate],
  );

  const stopWithVoice = useCallback(() => {
    stop();
    stopVoice();
  }, [stop, stopVoice]);

  // Cerrar el panel corta la locución en curso (el panel queda montado por la
  // animación, así que el cleanup de desmontaje no basta).
  useEffect(() => {
    if (!isOpen) {
      stopVoice();
    }
  }, [isOpen, stopVoice]);

  return {
    editMessageAndRegenerateWithVoice,
    isSpeaking,
    isVoiceEnabled,
    isVoiceTogglePending,
    sendMessageWithVoice,
    stopWithVoice,
    toggleVoiceEnabled,
  };
}
