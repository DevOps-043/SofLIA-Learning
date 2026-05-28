'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeContentForRenderer } from '@/lib/course-content';
import { isTTSAbortError } from '@/core/services/tts/client/tts-error.utils';
import { playAudioBlob } from '@/core/services/tts/client/audio-blob-player.service';
import { requestTTSAudio } from '@/core/services/tts/client/tts-api.service';
import { MAX_TTS_TEXT_LENGTH } from '@/core/services/tts/shared';

export type ActivityVoiceStatus = 'idle' | 'loading' | 'playing' | 'error';

export interface UseActivityVoiceReturn {
  status: ActivityVoiceStatus;
  /** 0–1 ratio of playback completed. 0 when idle. */
  playbackProgress: number;
  speak: (content: unknown) => Promise<void>;
  stop: () => void;
}

// ─── Text extraction ──────────────────────────────────────────────────────────

function extractPlainText(content: unknown): string {
  const raw = normalizeContentForRenderer(content);
  if (!raw.trim()) return '';

  const stripped = raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1').replace(/__([^_]+)__/g, '$1')
    .replace(/([^*])\*([^*]+)\*([^*])/g, '$1$2$3')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (stripped.length <= MAX_TTS_TEXT_LENGTH) return stripped;
  const truncated = stripped.slice(0, MAX_TTS_TEXT_LENGTH);
  const lastStop = Math.max(
    truncated.lastIndexOf('. '), truncated.lastIndexOf('.\n'),
    truncated.lastIndexOf('! '), truncated.lastIndexOf('? '),
  );
  return lastStop > MAX_TTS_TEXT_LENGTH * 0.7 ? truncated.slice(0, lastStop + 1) : truncated.trimEnd();
}

// ─── Chunking by sentences ────────────────────────────────────────────────────
//
// VERY small chunks (~200 chars ≈ ~12s of audio) so synthesis is fast (~5-7s).
// First audio arrives in ~6-8s instead of waiting 30+ seconds for the full text.
//
// Sequential pipeline:
//   t=0   → fetch(chunk0)
//   t=6s  → chunk0 ready → START PLAYING + fetch(chunk1) in background
//   t=18s → chunk0 done (12s playback)  → chunk1 already ready → instant
//   t=24s → fetch(chunk2) running during chunk1 playback
//   …seamless transitions.

const MAX_CHUNK_CHARS = 200;

function splitIntoSentenceChunks(text: string): string[] {
  // Split into sentences first, then group sentences into chunks ≤ MAX_CHUNK_CHARS
  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    // If a single sentence is longer than the limit, hard-split it by commas
    if (sentence.length > MAX_CHUNK_CHARS) {
      if (current) { chunks.push(current); current = ''; }
      const subChunks = hardSplitLongSentence(sentence, MAX_CHUNK_CHARS);
      chunks.push(...subChunks);
      continue;
    }

    const addLen = current ? 1 + sentence.length : sentence.length;
    if (current && current.length + addLen > MAX_CHUNK_CHARS) {
      chunks.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function hardSplitLongSentence(sentence: string, maxLen: number): string[] {
  const parts = sentence.split(/(?<=,)\s+/);
  const out: string[] = [];
  let current = '';
  for (const part of parts) {
    if (current && current.length + 1 + part.length > maxLen) {
      out.push(current);
      current = part;
    } else {
      current = current ? `${current} ${part}` : part;
    }
  }
  if (current) out.push(current);
  return out;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

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
    console.log(`[TTS] Split into ${totalChunks} chunks, avg ${Math.round(text.length / totalChunks)} chars each`);

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
