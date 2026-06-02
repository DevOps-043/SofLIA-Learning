'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  normalizeReadableAudioLanguage,
  normalizeReadableText,
  type ReadableAudioSourceKind,
} from '@/core/services/tts/readable-audio';
import {
  requestReadableAudioManifest,
  type ReadableAudioManifest,
  type ReadableAudioManifestSegment,
} from '@/core/services/tts/client/readable-audio-api.service';
import { DEFAULT_TTS_VOLUME } from '@/core/services/tts/shared';
import { useAuth } from '@/features/auth/hooks/useAuth';

export type ReadableAudioPlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface ReadableAudioSource {
  sourceKind: ReadableAudioSourceKind;
  sourceId: string;
  language?: string | null;
  content: unknown;
}

export interface UseReadableAudioPlaybackReturn {
  status: ReadableAudioPlaybackStatus;
  playbackProgress: number;
  speak: () => Promise<void>;
  pause: () => void;
  stop: () => void;
}

interface SavedReadableAudioProgress {
  contentHash: string;
  currentTime: number;
  segmentIndex: number;
  updatedAt: number;
}

const PROGRESS_KEY_PREFIX = 'tts-progress';
const PROGRESS_SAVE_INTERVAL_MS = 1_000;

function createFallbackHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function buildProgressKey(params: {
  userId: string;
  sourceKind: ReadableAudioSourceKind;
  sourceId: string;
  contentHash: string;
}) {
  return [
    PROGRESS_KEY_PREFIX,
    params.userId,
    params.sourceKind,
    params.sourceId,
    params.contentHash,
  ].join(':');
}

function readSavedProgress(key: string): SavedReadableAudioProgress | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<SavedReadableAudioProgress>;
    if (
      typeof parsed.contentHash !== 'string' ||
      typeof parsed.segmentIndex !== 'number' ||
      typeof parsed.currentTime !== 'number'
    ) {
      return null;
    }

    return {
      contentHash: parsed.contentHash,
      segmentIndex: Math.max(0, Math.trunc(parsed.segmentIndex)),
      currentTime: Math.max(0, parsed.currentTime),
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

function writeSavedProgress(key: string, progress: SavedReadableAudioProgress) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(progress));
  } catch {
    // localStorage may be disabled.
  }
}

function clearSavedProgress(key: string) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // localStorage may be disabled.
  }
}

function computeOverallProgress(
  segment: ReadableAudioManifestSegment,
  segmentProgress: number,
  totalLength: number,
) {
  if (totalLength <= 0) {
    return 0;
  }

  const segmentChars = segment.textLength * segmentProgress;
  return Math.min(1, Math.max(0, (segment.charStart + segmentChars) / totalLength));
}

export function useReadableAudioPlayback(
  source: ReadableAudioSource,
): UseReadableAudioPlaybackReturn {
  const { user } = useAuth();
  const [status, setStatus] = useState<ReadableAudioPlaybackStatus>('idle');
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const manifestRef = useRef<ReadableAudioManifest | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const currentSegmentIndexRef = useRef(0);
  const progressKeyRef = useRef<string | null>(null);
  const segmentResolveRef = useRef<(() => void) | null>(null);
  const lastProgressEmissionRef = useRef(0);
  const lastProgressSaveRef = useRef(0);
  const pausedRef = useRef(false);
  const playbackErrorRef = useRef(false);

  const text = useMemo(() => normalizeReadableText(source.content), [source.content]);
  const language = normalizeReadableAudioLanguage(source.language);
  const userId = user?.id || 'anonymous';

  const persistProgress = useCallback((currentTime: number) => {
    const manifest = manifestRef.current;
    const key = progressKeyRef.current;
    if (!manifest || !key) {
      return;
    }

    writeSavedProgress(key, {
      contentHash: manifest.contentHash,
      currentTime,
      segmentIndex: currentSegmentIndexRef.current,
      updatedAt: Date.now(),
    });
  }, []);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.load();
      audioRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      persistProgress(audioRef.current.currentTime || 0);
      audioRef.current.pause();
    }

    pausedRef.current = true;
    setStatus('paused');
  }, [persistProgress]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    pausedRef.current = false;
    segmentResolveRef.current?.();
    segmentResolveRef.current = null;
    cleanupAudio();
    setStatus('idle');
    setPlaybackProgress(0);
  }, [cleanupAudio]);

  useEffect(() => () => {
    if (audioRef.current) {
      persistProgress(audioRef.current.currentTime || 0);
    }
    stop();
  }, [persistProgress, stop]);

  const playSegment = useCallback(
    async (
      segment: ReadableAudioManifestSegment,
      manifest: ReadableAudioManifest,
      startTime: number,
      signal: AbortSignal,
    ) => {
      cleanupAudio();

      await new Promise<void>((resolve) => {
        const audio = new Audio(segment.audioUrl);
        audio.volume = DEFAULT_TTS_VOLUME;
        audio.preload = 'auto';
        audioRef.current = audio;
        segmentResolveRef.current = resolve;

        const finish = () => {
          if (segmentResolveRef.current === resolve) {
            segmentResolveRef.current = null;
          }
          resolve();
        };

        audio.onloadedmetadata = () => {
          if (startTime > 0 && Number.isFinite(audio.duration) && startTime < audio.duration - 0.25) {
            audio.currentTime = startTime;
          }
        };

        audio.ontimeupdate = () => {
          if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
            return;
          }

          const segmentProgress = Math.min(1, Math.max(0, audio.currentTime / audio.duration));
          const nextProgress = computeOverallProgress(segment, segmentProgress, manifest.textLength);
          const now = Date.now();

          if (
            nextProgress - lastProgressEmissionRef.current >= 0.005 ||
            nextProgress >= 0.999
          ) {
            lastProgressEmissionRef.current = nextProgress;
            setPlaybackProgress(nextProgress);
          }

          if (now - lastProgressSaveRef.current >= PROGRESS_SAVE_INTERVAL_MS) {
            lastProgressSaveRef.current = now;
            persistProgress(audio.currentTime || 0);
          }
        };

        audio.onended = finish;
        audio.onerror = () => {
          playbackErrorRef.current = true;
          setStatus('error');
          finish();
        };

        signal.addEventListener('abort', finish, { once: true });

        void audio.play().catch(() => {
          playbackErrorRef.current = true;
          setStatus('error');
          finish();
        });
      });
    },
    [cleanupAudio, persistProgress],
  );

  const playFromManifest = useCallback(
    async (
      manifest: ReadableAudioManifest,
      startSegmentIndex: number,
      startTime: number,
      controller: AbortController,
    ) => {
      manifestRef.current = manifest;
      pausedRef.current = false;
      setStatus('playing');

      for (let index = startSegmentIndex; index < manifest.segments.length; index += 1) {
        if (controller.signal.aborted || pausedRef.current) {
          return;
        }

        currentSegmentIndexRef.current = index;
        const segment = manifest.segments[index];
        await playSegment(
          segment,
          manifest,
          index === startSegmentIndex ? startTime : 0,
          controller.signal,
        );

        if (controller.signal.aborted || pausedRef.current || playbackErrorRef.current) {
          return;
        }
      }

      const key = progressKeyRef.current;
      if (key) {
        clearSavedProgress(key);
      }
      setPlaybackProgress(0);
      setStatus('idle');
      cleanupAudio();
    },
    [cleanupAudio, playSegment],
  );

  const speak = useCallback(async () => {
    if (status === 'playing') {
      pause();
      return;
    }

    if (status === 'paused' && manifestRef.current) {
      const current = audioRef.current;
      if (current) {
        pausedRef.current = false;
        setStatus('playing');
        void current.play().catch(() => setStatus('error'));
        return;
      }
    }

    if (!text) {
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    setStatus('loading');
    lastProgressEmissionRef.current = 0;
    lastProgressSaveRef.current = 0;
    playbackErrorRef.current = false;

    try {
      const manifest = await requestReadableAudioManifest(
        {
          sourceKind: source.sourceKind,
          sourceId: source.sourceId,
          language,
          text,
        },
        controller.signal,
      );

      if (controller.signal.aborted || manifest.segments.length === 0) {
        setStatus('idle');
        setPlaybackProgress(0);
        return;
      }

      const progressKey = buildProgressKey({
        userId,
        sourceKind: source.sourceKind,
        sourceId: source.sourceId,
        contentHash: manifest.contentHash || createFallbackHash(text),
      });
      progressKeyRef.current = progressKey;

      const saved = readSavedProgress(progressKey);
      const startSegmentIndex =
        saved?.contentHash === manifest.contentHash
          ? Math.min(saved.segmentIndex, manifest.segments.length - 1)
          : 0;
      const startTime = saved?.contentHash === manifest.contentHash ? saved.currentTime : 0;

      await playFromManifest(manifest, startSegmentIndex, startTime, controller);
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error('[TTS] readable audio playback error:', error);
        setStatus('error');
        setTimeout(() => {
          setStatus('idle');
          setPlaybackProgress(0);
        }, 3000);
      }
    }
  }, [
    language,
    pause,
    playFromManifest,
    source.sourceId,
    source.sourceKind,
    status,
    text,
    userId,
  ]);

  return {
    status,
    playbackProgress,
    speak,
    pause,
    stop,
  };
}
