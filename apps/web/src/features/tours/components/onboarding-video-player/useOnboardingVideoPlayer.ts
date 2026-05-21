import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useMediaPlaybackPolicy } from '@/core/hooks/useMediaPlaybackPolicy';
import {
  NATIVE_VIDEO_BUFFERING_DELAY_MS,
  NATIVE_VIDEO_STALLED_DELAY_MS,
  hasNativeVideoPlayableData,
} from '@/lib/media';
import { useVideoJsHlsPlayback } from '@/lib/media/useVideoJsHlsPlayback';
import type { OnboardingVideoPlayerProps } from './types';
import { useBufferingIndicator } from './useBufferingIndicator';
import { useControlsVisibility } from './useControlsVisibility';
import { useSlowConnection } from './useSlowConnection';

export function useOnboardingVideoPlayer({ onComplete, videos }: Pick<OnboardingVideoPlayerProps, 'onComplete' | 'videos'>) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const prevVideosRef = useRef<string[]>([]);
  const lastProgressRenderRef = useRef(0);
  const playbackPolicy = useMediaPlaybackPolicy('tour');
  const currentVideoSrc = videos[currentVideoIndex] ?? '';
  const shouldReduceMotion = useReducedMotion();
  const isSlowConnection = useSlowConnection();
  const { resetControlsTimeout, setShowControls, showControls } = useControlsVisibility(isPlaying);
  const { clearBufferingTimeout, markVideoResponsive, scheduleBufferingIndicator } = useBufferingIndicator(videoRef, setIsBuffering);
  // Controlador de calidad HLS: expone las renditions disponibles y permite
  // forzar una resolucion concreta. Se reutiliza en ControlsOverlay para
  // pintar el selector de calidad (mismo comportamiento que CustomVideoPlayer).
  const quality = useVideoJsHlsPlayback(videoRef, currentVideoSrc, playbackPolicy.nativeVideoPreload);

  useEffect(() => {
    const videosChanged = JSON.stringify(videos) !== JSON.stringify(prevVideosRef.current);
    if (videosChanged) {
      clearBufferingTimeout();
      setHasError(false); setIsPlaying(false); setIsBuffering(false);
      setProgress(0); setCurrentTime(0); setDuration(0);
      prevVideosRef.current = videos;
      videoRef.current?.load();
    }
    if (playbackPolicy.allowAutoplay && videoRef.current && !hasError && currentVideoIndex > 0) {
      videoRef.current.play().then(() => { setIsPlaying(true); setShowControls(true); }).catch((err) => techDebtLogger.error('[OnboardingVideoPlayer] autoplay error:', err));
    } else if (currentVideoIndex > 0) setIsPlaying(false);
  }, [clearBufferingTimeout, currentVideoIndex, hasError, playbackPolicy.allowAutoplay, setShowControls, videos]);

  const handleInteraction = useCallback(() => {
    if (isPlaying) resetControlsTimeout();
    else setShowControls(true);
  }, [isPlaying, resetControlsTimeout, setShowControls]);

  const handleVideoEnd = useCallback(() => {
    markVideoResponsive();
    setIsPlaying(false); setProgress(0); setCurrentTime(0); setDuration(0);
    if (currentVideoIndex < videos.length - 1) setCurrentVideoIndex((prev) => prev + 1);
    else onComplete();
  }, [currentVideoIndex, markVideoResponsive, onComplete, videos.length]);

  const handleCanPlay = useCallback(() => {
    markVideoResponsive();
    if (playbackPolicy.allowAutoplay && !isPlaying && currentVideoIndex === 0 && videoRef.current && !hasError) {
      videoRef.current.play().then(() => { setIsPlaying(true); setShowControls(false); }).catch(() => {});
    }
  }, [currentVideoIndex, hasError, isPlaying, markVideoResponsive, playbackPolicy.allowAutoplay, setShowControls]);

  const handleTimeUpdate = useCallback(() => {
    const el = videoRef.current;
    markVideoResponsive();
    if (!el || !el.duration || Number.isNaN(el.duration)) return;
    const now = performance.now();
    if (now - lastProgressRenderRef.current < 250) return;
    lastProgressRenderRef.current = now;
    setCurrentTime(el.currentTime);
    setProgress((el.currentTime / el.duration) * 100);
  }, [markVideoResponsive]);

  const handleLoadedMetadata = useCallback(() => {
    const el = videoRef.current;
    if (el && !Number.isNaN(el.duration)) setDuration(el.duration);
    markVideoResponsive();
  }, [markVideoResponsive]);

  const handleProgressEvent = useCallback(() => {
    if (hasNativeVideoPlayableData(videoRef.current)) markVideoResponsive();
  }, [markVideoResponsive]);

  const handlePlaying = useCallback(() => {
    markVideoResponsive();
    setIsPlaying(true);
  }, [markVideoResponsive]);

  const handleSeek = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const el = videoRef.current;
    if (!el || !el.duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    el.currentTime = pct * el.duration;
    setProgress(pct * 100);
    setCurrentTime(pct * el.duration);
  }, []);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isPlaying) { el.pause(); clearBufferingTimeout(); setIsBuffering(false); setIsPlaying(false); }
    else { el.play().catch((err) => techDebtLogger.error('[OnboardingVideoPlayer] play error:', err)); setShowControls(true); }
  }, [clearBufferingTimeout, isPlaying, setShowControls]);

  const toggleMute = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !isMuted;
    setIsMuted((prev) => !prev);
  }, [isMuted]);

  const handleRetry = useCallback(() => {
    clearBufferingTimeout();
    setHasError(false); setIsBuffering(false);
    videoRef.current?.load();
  }, [clearBufferingTimeout]);

  return {
    clearBufferingTimeout, currentTime, currentVideoIndex, currentVideoSrc, duration,
    handleCanPlay, handleInteraction, handleLoadedMetadata, handlePlaying, handleProgressEvent,
    handleRetry, handleSeek, handleTimeUpdate, handleVideoEnd,
    markVideoResponsive, resetControlsTimeout, scheduleBufferingIndicator, setShowControls, showControls,
    hasError, isBuffering, isMuted, isPlaying, isSlowConnection, playbackPolicy, progress, quality,
    setHasError, setIsBuffering, setIsPlaying, shouldReduceMotion, toggleMute, togglePlay, videoRef,
  };
}

export type OnboardingVideoController = ReturnType<typeof useOnboardingVideoPlayer>;
