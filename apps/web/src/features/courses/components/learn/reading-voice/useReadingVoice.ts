'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { logger } from '@/lib/utils/logger';

export type ReadingVoiceStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'preparing' | 'error';

export type ReadingAudioSourceType =
  | 'activity_reading'
  | 'material_reading'
  | 'lesson_transcript'
  | 'lesson_summary';

export interface ReadingVoiceSource {
  language?: 'es' | 'en' | 'pt';
  lessonId: string;
  organizationId?: string | null;
  slug: string;
  sourceId: string;
  sourceType: ReadingAudioSourceType;
}

export interface UseReadingVoiceReturn {
  activeSegmentIndex: number;
  speak: () => Promise<void>;
  status: ReadingVoiceStatus;
  stop: () => void;
}

type ReadingAudioManifest = {
  contentHash: string;
  expectedSegments: number;
  language: 'es' | 'en' | 'pt';
  progress: {
    completed: boolean;
    segmentIndex: number;
    segmentTimeSeconds: number;
  };
  segments: Array<{
    contentType: string;
    id: string;
    segmentIndex: number;
    url: string;
  }>;
  status: 'ready' | 'pending';
};

type PlaybackOutcome = 'ended' | 'aborted' | 'error';

const PROGRESS_SAVE_INTERVAL_MS = 8_000;

function buildManifestUrl(source: ReadingVoiceSource) {
  const params = new URLSearchParams({
    language: source.language ?? 'es',
    lessonId: source.lessonId,
    sourceId: source.sourceId,
    sourceType: source.sourceType,
  });
  return `/api/courses/${encodeURIComponent(source.slug)}/reading-audio/manifest?${params}`;
}

export function useReadingVoice(source: ReadingVoiceSource | null = null): UseReadingVoiceReturn {
  const [status, setStatus] = useState<ReadingVoiceStatus>('idle');
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSegmentIndexRef = useRef(0);
  const lastSavedAtRef = useRef(0);
  const pendingResumeRef = useRef<{ segmentIndex: number; segmentTimeSeconds: number } | null>(null);
  const sourceRef = useRef(source);
  const statusRef = useRef<ReadingVoiceStatus>('idle');

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const saveProgress = useCallback(
    async (segmentIndex: number, segmentTimeSeconds: number, completed = false) => {
      const currentSource = sourceRef.current;
      if (!currentSource) return;

      try {
        await fetch(`/api/courses/${encodeURIComponent(currentSource.slug)}/reading-audio/progress`, {
          body: JSON.stringify({
            completed,
            language: currentSource.language ?? 'es',
            lessonId: currentSource.lessonId,
            organizationId: currentSource.organizationId ?? null,
            segmentIndex,
            segmentTimeSeconds,
            sourceId: currentSource.sourceId,
            sourceType: currentSource.sourceType,
          }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'PUT',
        });
      } catch (error) {
        logger.warn('[reading-voice] no se pudo guardar progreso de audio', error);
      }
    },
    [],
  );

  const cleanupAudio = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.src = '';
    audioRef.current.load();
    audioRef.current = null;
  }, []);

  useEffect(() => {
    sourceRef.current = source;
    pendingResumeRef.current = null;
    setStatus('idle');
    setActiveSegmentIndex(-1);
    return () => {
      const audio = audioRef.current;
      if (audio && statusRef.current === 'playing') {
        void saveProgress(currentSegmentIndexRef.current, audio.currentTime, false);
      }
      abortRef.current?.abort();
      abortRef.current = null;
      cleanupAudio();
    };
  }, [
    cleanupAudio,
    saveProgress,
    source?.language,
    source?.lessonId,
    source?.slug,
    source?.sourceId,
    source?.sourceType,
  ]);

  const pausePlayback = useCallback(() => {
    const audio = audioRef.current;
    const segmentIndex = currentSegmentIndexRef.current;
    const segmentTimeSeconds = audio?.currentTime ?? 0;
    pendingResumeRef.current = { segmentIndex, segmentTimeSeconds };
    void saveProgress(segmentIndex, segmentTimeSeconds, false);

    abortRef.current?.abort();
    abortRef.current = null;
    cleanupAudio();
    setStatus('paused');
    setActiveSegmentIndex(segmentIndex);
  }, [cleanupAudio, saveProgress]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio && statusRef.current === 'playing') {
      void saveProgress(currentSegmentIndexRef.current, audio.currentTime, false);
    }
    abortRef.current?.abort();
    abortRef.current = null;
    cleanupAudio();
    setStatus('idle');
    setActiveSegmentIndex(-1);
  }, [cleanupAudio, saveProgress]);

  useEffect(() => () => { stop(); }, [stop]);

  const fetchManifest = useCallback(async (signal: AbortSignal) => {
    const currentSource = sourceRef.current;
    if (!currentSource) {
      throw new Error('Missing reading audio source');
    }

    const response = await fetch(buildManifestUrl(currentSource), {
      credentials: 'include',
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as ReadingAudioManifest;
  }, []);

  const playSegment = useCallback(
    async (
      segment: ReadingAudioManifest['segments'][number],
      startAtSeconds: number,
      signal: AbortSignal,
    ): Promise<PlaybackOutcome> => {
      cleanupAudio();

      return new Promise<PlaybackOutcome>((resolve) => {
        const audio = new Audio(segment.url);
        audio.preload = 'auto';
        audioRef.current = audio;
        currentSegmentIndexRef.current = segment.segmentIndex;
        setActiveSegmentIndex(segment.segmentIndex);

        let resolved = false;
        const finish = (outcome: PlaybackOutcome) => {
          if (resolved) return;
          resolved = true;
          audio.removeEventListener('ended', onEnded);
          audio.removeEventListener('error', onError);
          audio.removeEventListener('loadedmetadata', onLoadedMetadata);
          audio.removeEventListener('timeupdate', onTimeUpdate);
          signal.removeEventListener('abort', onAbort);
          resolve(outcome);
        };

        const onAbort = () => finish('aborted');
        const onEnded = () => finish('ended');
        const onError = () => finish('error');
        const onLoadedMetadata = () => {
          if (startAtSeconds > 0 && Number.isFinite(audio.duration)) {
            audio.currentTime = Math.min(startAtSeconds, Math.max(audio.duration - 0.25, 0));
          }
        };
        const onTimeUpdate = () => {
          const now = Date.now();
          if (now - lastSavedAtRef.current < PROGRESS_SAVE_INTERVAL_MS) return;
          lastSavedAtRef.current = now;
          void saveProgress(segment.segmentIndex, audio.currentTime, false);
        };

        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('timeupdate', onTimeUpdate);
        signal.addEventListener('abort', onAbort, { once: true });

        audio.play().catch((error) => {
          logger.warn('[reading-voice] no se pudo iniciar el audio', error);
          finish('error');
        });
      });
    },
    [cleanupAudio, saveProgress],
  );

  const startPlayback = useCallback(async () => {
    if (!sourceRef.current) {
      setStatus('error');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('loading');

    try {
      const manifest = await fetchManifest(controller.signal);
      if (controller.signal.aborted) return;

      if (manifest.status !== 'ready' || manifest.segments.length === 0) {
        setStatus('preparing');
        setActiveSegmentIndex(-1);
        return;
      }

      const resume = pendingResumeRef.current ?? (manifest.progress.completed ? null : manifest.progress);
      const startSegmentIndex = resume?.segmentIndex ?? manifest.segments[0].segmentIndex;
      const startPosition = Math.max(
        0,
        manifest.segments.findIndex((segment) => segment.segmentIndex === startSegmentIndex),
      );
      let startAtSeconds = resume?.segmentTimeSeconds ?? 0;
      pendingResumeRef.current = null;
      setStatus('playing');

      for (let index = startPosition; index < manifest.segments.length; index += 1) {
        if (controller.signal.aborted) return;

        const segment = manifest.segments[index];
        const outcome = await playSegment(segment, startAtSeconds, controller.signal);
        startAtSeconds = 0;

        if (outcome === 'aborted') return;
        if (outcome === 'error') {
          setStatus('error');
          setTimeout(() => setStatus('idle'), 3000);
          return;
        }

        const isLastSegment = index === manifest.segments.length - 1;
        const nextSegmentIndex = manifest.segments[index + 1]?.segmentIndex ?? segment.segmentIndex;
        if (isLastSegment) {
          await saveProgress(nextSegmentIndex, 0, true);
        } else {
          void saveProgress(nextSegmentIndex, 0, false);
        }
      }

      cleanupAudio();
      setStatus('idle');
      setActiveSegmentIndex(-1);
    } catch (error) {
      if (!controller.signal.aborted) {
        logger.error('[reading-voice] error al cargar audio pre-generado', error);
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [cleanupAudio, fetchManifest, playSegment, saveProgress]);

  const speak = useCallback(async () => {
    if (statusRef.current === 'playing' || statusRef.current === 'loading') {
      pausePlayback();
      return;
    }
    if (statusRef.current === 'preparing') {
      return;
    }
    await startPlayback();
  }, [pausePlayback, startPlayback]);

  return { activeSegmentIndex, speak, status, stop };
}
