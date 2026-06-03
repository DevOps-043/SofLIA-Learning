'use client';

import { isTTSAbortError } from './tts-error.utils';
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

export class StreamingSpeechPlayer {
  private chain: Promise<void> = Promise.resolve();
  private readonly controller = new AbortController();
  private readonly audioRef: AudioRef = { current: null };
  private stopped = false;
  private activeCount = 0;
  private readonly onPlayingChange?: (playing: boolean) => void;

  constructor(options: StreamingSpeechPlayerOptions = {}) {
    this.onPlayingChange = options.onPlayingChange;
  }

  /**
   * Encola un fragmento ya completo (una o varias oraciones) para locutar.
   * `onStart` se invoca cuando ESTE fragmento llega a reproducirse (o se omite
   * si su síntesis falló), permitiendo sincronizar el texto con el audio.
   */
  enqueue(text: string, onStart?: () => void): void {
    const clean = text.trim();
    if (!clean || this.stopped) return;

    // La síntesis arranca de inmediato (no espera su turno de reproducción).
    const synthesis = requestTTSAudio({ text: clean, context: 'chat' }, this.controller.signal);
    synthesis.catch(() => { /* se maneja al consumir en la cadena */ });

    if (this.activeCount === 0 && !this.stopped) {
      this.onPlayingChange?.(true);
    }
    this.activeCount += 1;

    this.chain = this.chain.then(async () => {
      let started = false;
      const markStarted = () => {
        if (!started) {
          started = true;
          onStart?.();
        }
      };

      try {
        if (this.controller.signal.aborted) return;

        let blob: Blob | null = null;
        try {
          blob = await synthesis;
        } catch (error) {
          if (!isTTSAbortError(error)) {
            // Un fragmento que falla no corta el resto: revela su texto igual.
            markStarted();
          }
          return;
        }

        if (this.controller.signal.aborted) return;
        if (!blob) {
          markStarted();
          return;
        }

        // A punto de reproducir → revela el texto en sincronía con el audio.
        markStarted();
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
  }

  /** Corta toda síntesis/reproducción pendiente. */
  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    try { this.controller.abort(); } catch { /* ignore */ }
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
