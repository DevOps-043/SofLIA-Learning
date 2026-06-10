'use client';

import { isTTSAbortError, isTTSQuotaExceededError } from './tts-error.utils';
import { playAudioBlob } from './audio-blob-player.service';
import { requestTTSAudio } from './tts-api.service';
import type { AudioRef } from './tts-client.types';

/**
 * Reproductor de voz para texto que llega en STREAMING. Cada fragmento se
 * sintetiza apenas se encola (solapando síntesis con la transmisión del texto y
 * con la reproducción previa) y se reproduce en ORDEN mediante una cadena de
 * promesas. Resultado: la primera oración suena en cuanto se completa, sin
 * esperar a toda la respuesta.
 */
export interface StreamingSpeechPlayerOptions {
  /**
   * Se invoca con `true` cuando hay síntesis/reproducción activa y con `false`
   * cuando la cola queda vacía o se detiene. Útil para indicadores de UI.
   */
  onPlayingChange?: (playing: boolean) => void;
}

export interface StreamingSpeechChunkStartEvent {
  audioAvailable: boolean;
}

export interface StreamingSpeechSynthesisEvent {
  audioAvailable: boolean;
  durationMs: number;
  failed: boolean;
}

function getNowMs(): number {
  return globalThis.performance?.now() ?? Date.now();
}

// Válvula de seguridad para evitar encolar fragmentos sin límite en respuestas
// patológicamente largas. NO es el regulador real del ritmo de síntesis: ese
// papel lo cumple `MAX_CONCURRENT_TTS_SYNTHESIS` (solo 2 síntesis a la vez) más
// la reproducción serializada. Una respuesta de chat realista (~1.5k caracteres)
// usa ~8 fragmentos, muy por debajo de este tope; respuestas largas se locutan
// completas en lugar de cortarse al cuarto fragmento.
const MAX_SPEECH_CHUNKS_PER_TURN = 48;
const MAX_CONCURRENT_TTS_SYNTHESIS = 2;

export class StreamingSpeechPlayer {
  private chain: Promise<void> = Promise.resolve();
  private readonly controller = new AbortController();
  private readonly audioRef: AudioRef = { current: null };
  private stopped = false;
  private activeCount = 0;
  private queuedChunkCount = 0;
  private activeSynthesisCount = 0;
  private readonly synthesisWaiters: Array<() => void> = [];
  private readonly onPlayingChange?: (playing: boolean) => void;

  constructor(options: StreamingSpeechPlayerOptions = {}) {
    this.onPlayingChange = options.onPlayingChange;
  }

  private createChunkSignal(): {
    signal: AbortSignal;
    dispose: () => void;
  } {
    const chunkController = new AbortController();
    const abortChunk = () => {
      if (!chunkController.signal.aborted) {
        chunkController.abort();
      }
    };

    if (this.controller.signal.aborted) {
      abortChunk();
    } else {
      this.controller.signal.addEventListener('abort', abortChunk, { once: true });
    }

    return {
      signal: chunkController.signal,
      dispose: () => {
        this.controller.signal.removeEventListener('abort', abortChunk);
      },
    };
  }

  private releaseSynthesisSlot(): void {
    this.activeSynthesisCount = Math.max(0, this.activeSynthesisCount - 1);
    const next = this.synthesisWaiters.shift();
    if (next && !this.stopped && !this.controller.signal.aborted) {
      next();
    }
  }

  private async acquireSynthesisSlot(signal: AbortSignal): Promise<void> {
    if (signal.aborted || this.stopped) {
      throw new DOMException('Aborted', 'AbortError');
    }

    if (this.activeSynthesisCount < MAX_CONCURRENT_TTS_SYNTHESIS) {
      this.activeSynthesisCount += 1;
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const removeWaiter = () => {
        const index = this.synthesisWaiters.indexOf(resolveSlot);
        if (index >= 0) this.synthesisWaiters.splice(index, 1);
      };
      const onAbort = () => {
        removeWaiter();
        reject(new DOMException('Aborted', 'AbortError'));
      };
      const resolveSlot = () => {
        signal.removeEventListener('abort', onAbort);
        this.activeSynthesisCount += 1;
        resolve();
      };

      if (signal.aborted || this.stopped) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }

      this.synthesisWaiters.push(resolveSlot);
      signal.addEventListener('abort', onAbort, { once: true });
    });
  }

  private async synthesizeWithBackpressure(
    payload: Parameters<typeof requestTTSAudio>[0],
    signal: AbortSignal,
  ): Promise<Blob | null> {
    await this.acquireSynthesisSlot(signal);
    try {
      if (signal.aborted || this.stopped) {
        throw new DOMException('Aborted', 'AbortError');
      }

      return await requestTTSAudio(payload, signal);
    } finally {
      this.releaseSynthesisSlot();
    }
  }

  /**
   * Encola un fragmento ya completo (una o varias oraciones) para locutar.
   * `onStart` se invoca cuando ESTE fragmento llega a reproducirse (o se omite
   * si su síntesis falló), permitiendo sincronizar el texto con el audio.
   * `onPlaybackSlot` se invoca cuando llega su turno en la cola; sirve para
   * activar degradaciones suaves si TTS tarda en entregar el audio.
   * `onSynthesisComplete` mide la latencia real del proveedor TTS por fragmento.
   */
  enqueue(
    text: string,
    onStart?: (event: StreamingSpeechChunkStartEvent) => void,
    onPlaybackSlot?: () => void,
    onSynthesisComplete?: (event: StreamingSpeechSynthesisEvent) => void,
  ): boolean {
    const clean = text.trim();
    if (!clean || this.stopped) return false;
    if (this.queuedChunkCount >= MAX_SPEECH_CHUNKS_PER_TURN) return false;

    // La síntesis arranca de inmediato (no espera su turno de reproducción).
    const synthesisStartedAt = getNowMs();
    const chunkIndex = this.queuedChunkCount;
    const context = chunkIndex === 0 ? 'chat' : 'chat_continuation';
    const chunkSignal = this.createChunkSignal();
    let synthesisReported = false;
    const reportSynthesis = (event: StreamingSpeechSynthesisEvent) => {
      if (synthesisReported) return;
      synthesisReported = true;
      onSynthesisComplete?.(event);
    };

    this.queuedChunkCount += 1;
    const synthesis = this.synthesizeWithBackpressure({ text: clean, context }, chunkSignal.signal)
      .then((blob) => {
        reportSynthesis({
          audioAvailable: Boolean(blob),
          durationMs: getNowMs() - synthesisStartedAt,
          failed: false,
        });
        return blob;
      })
      .catch((error) => {
        if (!isTTSAbortError(error)) {
          if (isTTSQuotaExceededError(error)) {
            this.stop();
          }
          reportSynthesis({
            audioAvailable: false,
            durationMs: getNowMs() - synthesisStartedAt,
            failed: true,
          });
        }
        throw error;
      })
      .finally(() => {
        chunkSignal.dispose();
      });
    synthesis.catch(() => { /* se maneja al consumir en la cadena */ });

    if (this.activeCount === 0 && !this.stopped) {
      this.onPlayingChange?.(true);
    }
    this.activeCount += 1;

    this.chain = this.chain.then(async () => {
      let started = false;
      const markStarted = (event: StreamingSpeechChunkStartEvent) => {
        if (!started) {
          started = true;
          onStart?.(event);
        }
      };

      try {
        if (this.controller.signal.aborted) return;
        onPlaybackSlot?.();

        let blob: Blob | null = null;
        try {
          blob = await synthesis;
        } catch (error) {
          if (!isTTSAbortError(error)) {
            // Un fragmento que falla no corta el resto: revela su texto igual.
            markStarted({ audioAvailable: false });
          }
          return;
        }

        if (this.controller.signal.aborted) return;
        if (!blob) {
          markStarted({ audioAvailable: false });
          return;
        }

        // A punto de reproducir → revela el texto en sincronía con el audio.
        markStarted({ audioAvailable: true });
        await new Promise<void>((resolve) => {
          playAudioBlob(blob as Blob, this.audioRef, { onFinish: () => resolve() }).catch(() => resolve());
          if (this.controller.signal.aborted) { resolve(); return; }
          this.controller.signal.addEventListener('abort', () => resolve(), { once: true });
        });
      } finally {
        this.activeCount -= 1;
        if (this.activeCount === 0 && !this.stopped) {
          this.onPlayingChange?.(false);
        }
      }
    });

    return true;
  }

  /** Corta toda síntesis/reproducción pendiente. */
  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    try { this.controller.abort(); } catch { /* ignore */ }
    this.synthesisWaiters.splice(0).forEach((resolve) => resolve());
    if (this.audioRef.current) {
      this.audioRef.current.pause();
      this.audioRef.current = null;
    }
    this.onPlayingChange?.(false);
  }
}

/**
 * Devuelve el índice (exclusivo) del PRIMER fragmento hablable, priorizando que
 * el primer audio arranque cuanto antes (reduce el desfase texto↔voz al inicio):
 *  1) fin de oración (`.`/`!`/`?` + espacio) o salto de línea, si llega pronto;
 *  2) si no, una cláusula corta: `,`/`;`/`:` + espacio a partir de `minChars`;
 *  3) si el texto ya supera `softCap` sin puntuación, corta en el último espacio.
 * Devuelve -1 si aún conviene esperar más texto.
 */
export function findFirstSpeakableBoundary(
  text: string,
  { minChars = 18, softCap = 70 }: { minChars?: number; softCap?: number } = {},
): number {
  const sentenceBoundary = findLastSentenceBoundary(text);
  if (sentenceBoundary > 0 && sentenceBoundary <= softCap) {
    return sentenceBoundary;
  }

  for (let i = minChars; i < text.length; i += 1) {
    const char = text[i];
    if (
      (char === ',' || char === ';' || char === ':') &&
      i + 1 < text.length &&
      /\s/.test(text[i + 1])
    ) {
      return i + 1;
    }
  }

  if (text.length >= softCap) {
    const lastSpace = text.lastIndexOf(' ', softCap);
    if (lastSpace > minChars) return lastSpace + 1;
  }

  return -1;
}

/**
 * Devuelve el índice (exclusivo) hasta el último límite de oración COMPLETO en
 * el texto: un `.`/`!`/`?` seguido de espacio, o un salto de línea. Se usa para
 * extraer solo oraciones terminadas durante el streaming (evita cortar números
 * como "3.5" o palabras a medio transmitir). Devuelve -1 si no hay ninguno.
 */
export function findLastSentenceBoundary(text: string): number {
  let lastIndex = -1;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '\n') {
      lastIndex = i + 1;
      continue;
    }
    if ((char === '.' || char === '!' || char === '?') && i + 1 < text.length && /\s/.test(text[i + 1])) {
      lastIndex = i + 1;
    }
  }
  return lastIndex;
}
