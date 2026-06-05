'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { logger } from '@/lib/utils/logger';

export type ReadingAudioStatus =
  | 'idle' // not loaded yet
  | 'loading' // fetching manifest / audio
  | 'playing'
  | 'paused'
  | 'unavailable' // no pre-generated audio exists for this reading
  | 'error';

export type ReadingAudioSourceType =
  | 'activity_reading'
  | 'material_reading'
  | 'lesson_transcript'
  | 'lesson_summary';

export interface ReadingAudioSource {
  language?: 'es' | 'en' | 'pt';
  lessonId: string;
  organizationId?: string | null;
  slug: string;
  sourceId: string;
  sourceType: ReadingAudioSourceType;
}

export interface UseReadingAudioPlayerReturn {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  seek: (seconds: number) => void;
  status: ReadingAudioStatus;
  toggle: () => Promise<void>;
}

type ReadingAudioManifest = {
  progress: { completed: boolean; segmentIndex: number; segmentTimeSeconds: number };
  segments: Array<{ id: string; segmentIndex: number; url: string }>;
  status: 'ready' | 'pending';
};

type SaveProgressOptions = {
  keepalive?: boolean;
  transport?: 'fetch' | 'beacon';
};

const PROGRESS_SAVE_INTERVAL_MS = 8_000;

function buildManifestUrl(source: ReadingAudioSource) {
  const params = new URLSearchParams({
    language: source.language ?? 'es',
    lessonId: source.lessonId,
    sourceId: source.sourceId,
    sourceType: source.sourceType,
  });
  return `/api/courses/${encodeURIComponent(source.slug)}/reading-audio/manifest?${params}`;
}

/**
 * Single-track reading audio player. Reads the pre-generated MP3 from storage (via
 * the manifest -> segment URL) and plays it through ONE persistent <audio> element so
 * the user can pause, resume, and seek to any position. It never triggers synthesis;
 * if no audio exists the status is `unavailable`.
 */
export function useReadingAudioPlayer(
  source: ReadingAudioSource | null = null,
): UseReadingAudioPlayerReturn {
  const [status, setStatus] = useState<ReadingAudioStatus>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const resumeAtRef = useRef(0);
  const lastSavedAtRef = useRef(0);
  const completedRef = useRef(false);
  const sourceRef = useRef(source);

  const saveProgress = useCallback(async (
    timeSeconds: number,
    completed = false,
    options: SaveProgressOptions = {},
  ) => {
    const current = sourceRef.current;
    if (!current) return;
    const url = `/api/courses/${encodeURIComponent(current.slug)}/reading-audio/progress`;
    const payload = {
      completed,
      language: current.language ?? 'es',
      lessonId: current.lessonId,
      organizationId: current.organizationId ?? null,
      segmentIndex: 0,
      segmentTimeSeconds: timeSeconds,
      sourceId: current.sourceId,
      sourceType: current.sourceType,
    };

    if (options.transport === 'beacon' && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const body = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      if (navigator.sendBeacon(url, body)) return;
    }

    try {
      const response = await fetch(url, {
        method: options.transport === 'beacon' ? 'POST' : 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        keepalive: options.keepalive,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        logger.warn('[reading-audio] progreso rechazado por el servidor', {
          status: response.status,
          statusText: response.statusText,
        });
      }
    } catch (error) {
      logger.warn('[reading-audio] no se pudo guardar progreso', error);
    }
  }, []);

  const persistCurrentPosition = useCallback((options: SaveProgressOptions = {}) => {
    const audio = audioRef.current;
    if (!audio || completedRef.current) return;
    if (!Number.isFinite(audio.currentTime) || audio.currentTime <= 0) return;

    void saveProgress(audio.currentTime, false, options);
  }, [saveProgress]);

  const teardownAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = '';
    audio.load();
    audioRef.current = null;
  }, []);

  // Reset everything whenever the source (lesson / section) changes.
  useEffect(() => {
    sourceRef.current = source;
    audioUrlRef.current = null;
    resumeAtRef.current = 0;
    completedRef.current = false;
    setStatus('idle');
    setCurrentTime(0);
    setDuration(0);
    return () => {
      persistCurrentPosition({ keepalive: true });
      teardownAudio();
    };
  }, [
    persistCurrentPosition,
    teardownAudio,
    source?.language,
    source?.lessonId,
    source?.organizationId,
    source?.slug,
    source?.sourceId,
    source?.sourceType,
  ]);

  useEffect(() => {
    const persistWithBeacon = () => {
      persistCurrentPosition({ keepalive: true, transport: 'beacon' });
    };
    const persistWhenHidden = () => {
      if (document.visibilityState === 'hidden') persistWithBeacon();
    };

    window.addEventListener('pagehide', persistWithBeacon);
    window.addEventListener('beforeunload', persistWithBeacon);
    document.addEventListener('visibilitychange', persistWhenHidden);

    return () => {
      window.removeEventListener('pagehide', persistWithBeacon);
      window.removeEventListener('beforeunload', persistWithBeacon);
      document.removeEventListener('visibilitychange', persistWhenHidden);
    };
  }, [persistCurrentPosition]);

  const attachAudio = useCallback(
    (url: string) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audioRef.current = audio;

      audio.addEventListener('loadedmetadata', () => {
        setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
        if (resumeAtRef.current > 0 && Number.isFinite(audio.duration)) {
          audio.currentTime = Math.min(resumeAtRef.current, Math.max(audio.duration - 0.25, 0));
          setCurrentTime(audio.currentTime);
        }
      });
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
        const now = Date.now();
        if (now - lastSavedAtRef.current >= PROGRESS_SAVE_INTERVAL_MS && !audio.paused) {
          lastSavedAtRef.current = now;
          void saveProgress(audio.currentTime, false);
        }
      });
      audio.addEventListener('play', () => setStatus('playing'));
      audio.addEventListener('pause', () => {
        // 'ended' also fires a pause; the ended handler owns that transition.
        if (!audio.ended) {
          setStatus('paused');
          persistCurrentPosition({ keepalive: true });
        }
      });
      audio.addEventListener('ended', () => {
        completedRef.current = true;
        setStatus('paused');
        setCurrentTime(0);
        audio.currentTime = 0;
        void saveProgress(0, true);
      });
      audio.addEventListener('error', () => {
        logger.warn('[reading-audio] error reproduciendo audio');
        setStatus('error');
      });
      return audio;
    },
    [persistCurrentPosition, saveProgress],
  );

  const loadAndPlay = useCallback(async () => {
    const current = sourceRef.current;
    if (!current) return;

    setStatus('loading');
    try {
      const response = await fetch(buildManifestUrl(current), { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = (await response.json()) as ReadingAudioManifest;

      const segment = manifest.segments[0];
      if (manifest.status !== 'ready' || !segment) {
        setStatus('unavailable');
        return;
      }

      resumeAtRef.current = manifest.progress.completed ? 0 : manifest.progress.segmentTimeSeconds;
      completedRef.current = false;
      audioUrlRef.current = segment.url;
      const audio = attachAudio(segment.url);
      await audio.play();
    } catch (error) {
      logger.error('[reading-audio] no se pudo cargar el audio', error);
      setStatus('error');
    }
  }, [attachAudio]);

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (audio && audioUrlRef.current) {
      if (audio.paused) {
        await audio.play().catch((error) => {
          logger.warn('[reading-audio] no se pudo reanudar', error);
          setStatus('error');
        });
      } else {
        audio.pause();
      }
      return;
    }
    await loadAndPlay();
  }, [loadAndPlay]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    const clamped = Math.min(Math.max(seconds, 0), audio.duration);
    completedRef.current = false;
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  }, []);

  return {
    currentTime,
    duration,
    isPlaying: status === 'playing',
    seek,
    status,
    toggle,
  };
}
