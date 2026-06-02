'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/utils/logger';
import { isTTSAbortError } from '@/core/services/tts/client/tts-error.utils';
import { playAudioBlob } from '@/core/services/tts/client/audio-blob-player.service';
import { requestTTSAudio } from '@/core/services/tts/client/tts-api.service';
import {
  buildReadingSpeechRequests,
  segmentReadingContent,
  type ReadingSpeechRequest,
} from '@/lib/reading/reading-segmentation';

export type ReadingVoiceStatus = 'idle' | 'loading' | 'playing' | 'error';

export interface UseReadingVoiceReturn {
  status: ReadingVoiceStatus;
  /** Índice del segmento que está sonando (-1 si no hay reproducción). */
  activeSegmentIndex: number;
  speak: (content: unknown) => Promise<void>;
  stop: () => void;
}

/**
 * Reproduce una lectura SEGMENTO A SEGMENTO (cada segmento = un bloque del
 * lector). El subrayado se alinea con `activeSegmentIndex` (el segmento que
 * realmente suena), eliminando el desfase de la estimación por caracteres.
 *
 * - Cada segmento se sintetiza completo → no se corta la lectura.
 * - Si un segmento falla, se omite y se continúa (no aborta la lectura).
 * - Prefetch del siguiente segmento para transiciones fluidas.
 * - Con pre-generación, cada segmento es un cache-hit instantáneo en `/api/tts`.
 */
export function useReadingVoice(): UseReadingVoiceReturn {
  const [status, setStatus] = useState<ReadingVoiceStatus>('idle');
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Lock síncrono: evita dos reproducciones simultáneas si llegan dos clics
  // antes de que React confirme el setStatus.
  const isActiveRef = useRef(false);

  const stop = useCallback(() => {
    isActiveRef.current = false;
    try { abortRef.current?.abort(); } catch { /* ignore */ }
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setStatus('idle');
    setActiveSegmentIndex(-1);
  }, []);

  useEffect(() => () => { stop(); }, [stop]);

  const speak = useCallback(async (content: unknown) => {
    // Toggle-off si ya está sonando.
    if (isActiveRef.current) {
      stop();
      return;
    }
    isActiveRef.current = true;

    const requests = buildReadingSpeechRequests(segmentReadingContent(content));
    const spokenRequests = requests.filter((request) => request.text.length > 0);
    if (spokenRequests.length === 0) {
      isActiveRef.current = false;
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('loading');
    setActiveSegmentIndex(-1);

    const fetchSegment = (request: ReadingSpeechRequest) =>
      requestTTSAudio({ text: request.text, context: request.context }, controller.signal);

    let prefetched: Promise<Blob | null> | null = null;

    try {
      for (let i = 0; i < spokenRequests.length; i += 1) {
        if (controller.signal.aborted) break;

        const blobPromise = prefetched ?? fetchSegment(spokenRequests[i]);
        prefetched = null;

        let blob: Blob | null;
        try {
          blob = await blobPromise;
        } catch (error) {
          if (isTTSAbortError(error)) break;
          // Robustez: un segmento que falla NO corta la lectura → se omite.
          logger.warn('[reading-voice] segmento omitido por error de síntesis', error);
          continue;
        }

        if (controller.signal.aborted || abortRef.current !== controller) break;
        if (!blob) break; // Proveedor no configurado (503): no hay audio.

        setStatus('playing');
        setActiveSegmentIndex(spokenRequests[i].index);

        // Prefetch del siguiente segmento durante la reproducción del actual.
        if (i + 1 < spokenRequests.length) {
          prefetched = fetchSegment(spokenRequests[i + 1]);
          prefetched.catch(() => { /* se maneja al await en la próxima iteración */ });
        }

        // playAudioBlob resuelve al INICIAR play(); esperamos onFinish para no
        // solapar segmentos ("doble voz").
        await new Promise<void>((resolve) => {
          playAudioBlob(blob, audioRef, { onFinish: () => resolve() }).catch(() => resolve());
          if (controller.signal.aborted) { resolve(); return; }
          controller.signal.addEventListener('abort', () => resolve(), { once: true });
        });

        if (controller.signal.aborted) break;
      }
    } catch (error) {
      if (!isTTSAbortError(error)) {
        logger.error('[reading-voice] error de reproducción', error);
        isActiveRef.current = false;
        setStatus('error');
        setActiveSegmentIndex(-1);
        setTimeout(() => setStatus('idle'), 3000);
        return;
      }
    }

    isActiveRef.current = false;
    if (!controller.signal.aborted) {
      setStatus('idle');
      setActiveSegmentIndex(-1);
    }
    if (abortRef.current === controller) abortRef.current = null;
  }, [stop]);

  return { status, activeSegmentIndex, speak, stop };
}
