'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isTTSAbortError } from '@/core/services/tts/client/tts-error.utils';
import { playAudioBlob } from '@/core/services/tts/client/audio-blob-player.service';
import { requestTTSAudio } from '@/core/services/tts/client/tts-api.service';
import { extractPlainText, splitIntoSentenceChunks } from './activity-voice-text';

export type ActivityVoiceStatus = 'idle' | 'loading' | 'playing' | 'error';

export interface UseActivityVoiceReturn {
  status: ActivityVoiceStatus;
  /** 0–1 ratio of playback completed. 0 when idle. */
  playbackProgress: number;
  speak: (content: unknown) => Promise<void>;
  stop: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
//
// Orquesta la reproducción: extrae el texto, lo trocea (helpers puros en
// `activity-voice-text.ts`) y reproduce los chunks en secuencia con prefetch del
// siguiente para transiciones fluidas.

export function useActivityVoice(): UseActivityVoiceReturn {
  const [status, setStatus] = useState<ActivityVoiceStatus>('idle');
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Ref-based lock: avoids stale-closure issues when two clicks fire before
  // React commits the setStatus update — prevents two audios playing at once.
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
    setPlaybackProgress(0);
  }, []);

  useEffect(() => () => { stop(); }, [stop]);

  const speak = useCallback(async (content: unknown) => {
    // Toggle-off if already speaking (synchronous ref check)
    if (isActiveRef.current) {
      stop();
      return;
    }
    isActiveRef.current = true;

    const text = extractPlainText(content);
    if (!text) return;

    const chunks = splitIntoSentenceChunks(text);
    const totalChunks = chunks.length;
    // Per-chunk char counts: lets us map audio progress to REAL chars read
    // instead of assuming every chunk has the same duration (it doesn't —
    // a 150-char sentence finishes much faster than a 220-char one).
    const chunkLengths = chunks.map((c) => c.length);
    const totalChars = chunkLengths.reduce((a, b) => a + b, 0);
    // Cumulative chars BEFORE each chunk index (prefix sum)
    const charsBeforeChunk: number[] = [];
    {
      let acc = 0;
      for (const len of chunkLengths) {
        charsBeforeChunk.push(acc);
        acc += len;
      }
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('loading');
    setPlaybackProgress(0);

    let prefetchedBlob: Promise<Blob | null> | null = null;
    // Throttle progress emissions — ontimeupdate fires ~30 Hz which causes
    // wasteful re-renders. Only emit when progress advanced by ≥ 0.5%.
    let lastEmittedProgress = 0;

    try {
      for (let i = 0; i < totalChunks; i++) {
        if (controller.signal.aborted) break;

        const context = i === 0 ? 'reading' : 'reading_continuation';

        // Use prefetched blob if available, else fetch now
        const blobPromise: Promise<Blob | null> =
          prefetchedBlob ?? requestTTSAudio({ text: chunks[i], context }, controller.signal);
        prefetchedBlob = null;

        let blob: Blob | null;
        try {
          blob = await blobPromise;
        } catch (fetchErr) {
          if (isTTSAbortError(fetchErr)) break;
          throw fetchErr;
        }

        if (controller.signal.aborted || abortRef.current !== controller) break;
        if (!blob) {
          isActiveRef.current = false;
          setStatus('idle');
          setPlaybackProgress(0);
          return;
        }

        setStatus('playing');

        // Start prefetching the next chunk DURING playback of this one.
        // CRITICAL: attach a no-op .catch so the eventual rejection doesn't
        // bubble up as an "unhandledRejection" before we await it next iteration.
        // The original promise still rejects → next iteration's `await` will throw.
        if (i + 1 < totalChunks) {
          prefetchedBlob = requestTTSAudio(
            { text: chunks[i + 1], context: 'reading_continuation' },
            controller.signal,
          );
          prefetchedBlob.catch(() => { /* handled when awaited below */ });
        }

        // CRITICAL: playAudioBlob's promise resolves when play() STARTS, not
        // when audio ends. We must explicitly wait for onFinish before moving
        // to the next chunk — otherwise chunks overlap and produce "double voice".
        await new Promise<void>((resolve) => {
          playAudioBlob(blob, audioRef, {
            onFinish: () => resolve(),
            onProgress: (p) => {
              // Map audio playback fraction to REAL chars read across the
              // whole text (chunks have varying lengths → varying durations).
              const charsRead = charsBeforeChunk[i] + p * chunkLengths[i];
              const newProgress = totalChars > 0 ? charsRead / totalChars : 0;
              // Skip emissions smaller than 0.5% — no perceivable change but
              // would trigger a React re-render and CSS transition restart,
              // which the user perceives as flicker.
              if (newProgress - lastEmittedProgress >= 0.005 || newProgress >= 0.999) {
                lastEmittedProgress = newProgress;
                setPlaybackProgress(newProgress);
              }
            },
          }).catch(() => resolve());

          // Abort path: resolve when the controller is aborted
          if (controller.signal.aborted) { resolve(); return; }
          controller.signal.addEventListener('abort', () => resolve(), { once: true });
        });

        if (controller.signal.aborted) break;
      }
    } catch (error) {
      if (!isTTSAbortError(error)) {
        console.error('[TTS] playback error:', error);
        isActiveRef.current = false;
        setStatus('error');
        setTimeout(() => { setStatus('idle'); setPlaybackProgress(0); }, 3000);
        return;
      }
    }

    isActiveRef.current = false;
    if (!controller.signal.aborted) {
      setStatus('idle');
      setPlaybackProgress(0);
    }
    if (abortRef.current === controller) abortRef.current = null;
  }, [stop]);

  return { status, playbackProgress, speak, stop };
}
