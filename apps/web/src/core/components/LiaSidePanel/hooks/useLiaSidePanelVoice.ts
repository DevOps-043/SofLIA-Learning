'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { SofLIAMessage } from '../../../types/lia.types';
import type { SofLIAPersonalizationSettings } from '../../../types/soflia-personalization.types';
import {
  StreamingSpeechPlayer,
  findFirstSpeakableBoundary,
  findLastSentenceBoundary,
} from '../../../services/tts/client/streaming-speech-player';
import { cleanTextForLiaTTS } from '../services/lia-side-panel-voice.service';

interface UseLiaSidePanelVoiceOptions {
  messages: SofLIAMessage[];
  isLoading: boolean;
  isOpen: boolean;
  isVoiceEnabled: boolean;
  language: string;
  settings: SofLIAPersonalizationSettings | null | undefined;
}

/**
 * Largo de texto (índice exclusivo) ya "revelado" en sincronía con el audio para
 * un mensaje dado. Cuando `messageId` es `null` no hay restricción de revelado
 * (el texto se muestra completo, p. ej. con la voz desactivada).
 */
export interface VoiceRevealState {
  messageId: string | null;
  length: number;
}

const NO_REVEAL: VoiceRevealState = { messageId: null, length: 0 };

/**
 * Voz de salida del panel SofLIA en STREAMING con sincronía estilo "karaoke":
 * cada oración se sintetiza y reproduce apenas se completa en la transmisión, y
 * el TEXTO de la respuesta se revela al ritmo del audio (no antes). Cuando la voz
 * está desactivada no hay revelado gradual (el texto se muestra completo).
 *
 * Solo locuta/revela respuestas presenciadas en streaming (pasan por la fase
 * `isLoading=true` con contenido creciente); el saludo estático y el historial
 * cargado no se ven afectados.
 */
export function useLiaSidePanelVoice({
  messages,
  isLoading,
  isOpen,
  isVoiceEnabled,
  language: _language,
  settings: _settings,
}: UseLiaSidePanelVoiceOptions) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceReveal, setVoiceReveal] = useState<VoiceRevealState>(NO_REVEAL);
  const playerRef = useRef<StreamingSpeechPlayer | null>(null);
  // Estado de la respuesta que se está presenciando en streaming.
  const streamRef = useRef<{ messageId: string | null; consumed: number }>({
    messageId: null,
    consumed: 0,
  });

  const stopAllAudio = useCallback(() => {
    playerRef.current?.stop();
    playerRef.current = null;
    streamRef.current = { messageId: null, consumed: 0 };
    setIsSpeaking(false);
    setVoiceReveal(NO_REVEAL);
  }, []);

  // Encola un fragmento y programa revelar su texto cuando empiece a sonar.
  const enqueueWithReveal = useCallback(
    (messageId: string, chunk: string, endIndex: number) => {
      const cleaned = cleanTextForLiaTTS(chunk);
      if (!cleaned) return;
      playerRef.current?.enqueue(cleaned, () => {
        setVoiceReveal((prev) =>
          prev.messageId === messageId ? { messageId, length: endIndex } : prev,
        );
      });
    },
    [],
  );

  useEffect(() => {
    // La voz es opt-in (`voice_enabled`): si está activa, locuta y revela el
    // texto en sincronía; si no, no gatea el revelado (texto completo al instante).
    if (!isVoiceEnabled || messages.length === 0) {
      return;
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant' || lastMessage.id === 'initial') {
      return;
    }

    const content = lastMessage.content ?? '';

    if (isLoading) {
      // Respuesta en curso (presenciada en streaming).
      if (streamRef.current.messageId !== lastMessage.id) {
        playerRef.current?.stop();
        playerRef.current = new StreamingSpeechPlayer({ onPlayingChange: setIsSpeaking });
        streamRef.current = { messageId: lastMessage.id, consumed: 0 };
        setVoiceReveal({ messageId: lastMessage.id, length: 0 });
      }

      if (!playerRef.current) return;

      const consumed = streamRef.current.consumed;
      const pending = content.slice(consumed);
      // El PRIMER fragmento arranca cuanto antes (cláusula corta) para reducir
      // el desfase inicial; los siguientes se cortan por oración completa.
      const boundary =
        consumed === 0
          ? findFirstSpeakableBoundary(pending)
          : findLastSentenceBoundary(pending);
      if (boundary > 0) {
        const endIndex = consumed + boundary;
        enqueueWithReveal(lastMessage.id, pending.slice(0, boundary), endIndex);
        streamRef.current.consumed = endIndex;
      }
      return;
    }

    // isLoading === false
    if (streamRef.current.messageId === lastMessage.id && playerRef.current) {
      // Fin de una respuesta que sí presenciamos: locuta/revela el resto.
      const pending = content.slice(streamRef.current.consumed);
      if (pending.trim()) {
        enqueueWithReveal(lastMessage.id, pending, content.length);
      }
      streamRef.current = { messageId: null, consumed: 0 };
    }
    // Si no la presenciamos (saludo/historial/ya cerrada) → no se locuta/revela.
  }, [messages, isLoading, isVoiceEnabled, enqueueWithReveal]);

  // Si se desactiva la voz, libera el revelado (muestra el texto completo).
  useEffect(() => {
    if (!isVoiceEnabled) {
      stopAllAudio();
    }
  }, [isVoiceEnabled, stopAllAudio]);

  // Corta la voz al cerrar el panel y al desmontar.
  useEffect(() => {
    if (!isOpen) {
      stopAllAudio();
    }
    return () => {
      stopAllAudio();
    };
  }, [isOpen, stopAllAudio]);

  return {
    isSpeaking,
    voiceReveal,
    stopAllAudio,
  };
}
