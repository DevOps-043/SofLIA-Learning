'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSofLIAPersonalization } from './useSofLIAPersonalization';
import { cleanTextForSpeech } from '../services/tts/client/clean-text';
import {
  StreamingSpeechPlayer,
  findLastSentenceBoundary,
} from '../services/tts/client/streaming-speech-player';
import type { SofLIAMessage } from '../types/lia.types';

interface UseStreamingChatVoiceParams {
  messages: SofLIAMessage[];
  isLoading: boolean;
}

interface UseStreamingChatVoiceReturn {
  /**
   * Arma la voz para locutar la PRÓXIMA respuesta del asistente. Debe llamarse
   * justo al enviar un mensaje del usuario. Evita depender del timing del stream
   * y garantiza que NO se locute el saludo inicial ni el historial cargado
   * (esos aparecen sin pasar por un "send").
   */
  armForNextResponse: () => void;
  /** Corta la locución en curso. */
  stop: () => void;
}

/**
 * Locuta la respuesta del asistente A MEDIDA QUE SE TRANSMITE: en cuanto una
 * oración se completa en el stream, se sintetiza y reproduce (sin esperar a toda
 * la respuesta) → latencia mínima. Respeta el toggle `voice_enabled`.
 */
export function useStreamingChatVoice({
  messages,
  isLoading,
}: UseStreamingChatVoiceParams): UseStreamingChatVoiceReturn {
  const { settings } = useSofLIAPersonalization();
  const isVoiceEnabled = settings?.voice_enabled ?? true;

  const playerRef = useRef<StreamingSpeechPlayer | null>(null);
  const stateRef = useRef<{ messageId: string | null; consumed: number }>({
    messageId: null,
    consumed: 0,
  });
  // "Armado": solo locutamos la respuesta que sigue a un envío del usuario.
  const armedRef = useRef(false);

  const stop = useCallback(() => {
    playerRef.current?.stop();
    playerRef.current = null;
    stateRef.current = { messageId: null, consumed: 0 };
  }, []);

  const armForNextResponse = useCallback(() => {
    // Corta cualquier locución previa y prepara la captura de la próxima respuesta.
    playerRef.current?.stop();
    playerRef.current = null;
    stateRef.current = { messageId: null, consumed: 0 };
    armedRef.current = true;
  }, []);

  useEffect(() => () => { stop(); }, [stop]);

  useEffect(() => {
    if (!armedRef.current || !isVoiceEnabled) return;

    const lastMessage = messages[messages.length - 1];
    // Tras enviar, el último mensaje es el del usuario → esperamos al del asistente.
    if (!lastMessage || lastMessage.role !== 'assistant') return;

    const content = lastMessage.content ?? '';

    // Primer avistamiento de la respuesta armada → empezamos a capturarla.
    if (stateRef.current.messageId !== lastMessage.id) {
      playerRef.current?.stop();
      playerRef.current = new StreamingSpeechPlayer();
      stateRef.current = { messageId: lastMessage.id, consumed: 0 };
    }

    const player = playerRef.current;
    if (!player) return;

    const pending = content.slice(stateRef.current.consumed);

    if (isLoading) {
      // Durante el stream: locuta solo oraciones COMPLETAS conforme llegan.
      const boundary = findLastSentenceBoundary(pending);
      if (boundary > 0) {
        const chunk = cleanTextForSpeech(pending.slice(0, boundary));
        if (chunk) player.enqueue(chunk);
        stateRef.current.consumed += boundary;
      }
    } else {
      // La respuesta terminó: locuta el resto y desarma.
      if (pending.trim()) {
        const chunk = cleanTextForSpeech(pending);
        if (chunk) player.enqueue(chunk);
        stateRef.current.consumed = content.length;
      }
      armedRef.current = false;
    }
  }, [messages, isLoading, isVoiceEnabled]);

  return { armForNextResponse, stop };
}
