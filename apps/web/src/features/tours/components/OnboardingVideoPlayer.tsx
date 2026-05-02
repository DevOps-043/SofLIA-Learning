'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, SkipForward, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMediaPlaybackPolicy } from '@/core/hooks/useMediaPlaybackPolicy';

interface OnboardingVideoPlayerProps {
  videos: string[];
  onComplete: () => void;
  /** Cuando false, oculta el boton de saltar. Default: true */
  isSkippable?: boolean;
}

export function OnboardingVideoPlayer({ videos, onComplete, isSkippable = true }: OnboardingVideoPlayerProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);    // 0–100
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const prevVideosRef = useRef<string[]>([]);
  const lastProgressRenderRef = useRef(0);
  const playbackPolicy = useMediaPlaybackPolicy('tour');
  const { t } = useTranslation('common');
  const skipIntroLabel = t('onboarding.buttons.skipIntro');
  const retryLabel = t('actions.retry');
  const skipToContentLabel = t('media.introPlayer.skipToContent');

  // Respect OS-level "reduce motion" preference — skip overlay fade animation
  const shouldReduceMotion = useReducedMotion();

  // ── Detect slow connections (Network Information API, best-effort) ─────────
  useEffect(() => {
    type NetworkInfo = { effectiveType?: string; saveData?: boolean; addEventListener?: (e: string, cb: () => void) => void; removeEventListener?: (e: string, cb: () => void) => void };
    const connection = (navigator as Navigator & { connection?: NetworkInfo }).connection;
    if (!connection) return;

    const evaluate = () => {
      setIsSlowConnection(
        connection.saveData === true ||
        connection.effectiveType === '2g' ||
        connection.effectiveType === 'slow-2g'
      );
    };

    evaluate();
    connection.addEventListener?.('change', evaluate);
    return () => connection.removeEventListener?.('change', evaluate);
  }, []);

  // ── Reload player when video list changes ─────────────────────────────────
  useEffect(() => {
    const videosChanged =
      JSON.stringify(videos) !== JSON.stringify(prevVideosRef.current);

    if (videosChanged) {
      setHasError(false);
      setIsPlaying(false);
      setIsBuffering(false);
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
      prevVideosRef.current = videos;
      videoRef.current?.load();
    }

    // Auto-play subsequent videos only when the shared policy allows it.
    // iOS/mobile keeps playback user-initiated to avoid rejected play() loops
    // and extra decoder wake-ups.
    if (
      playbackPolicy.allowAutoplay &&
      videoRef.current &&
      !hasError &&
      currentVideoIndex > 0
    ) {
      videoRef.current
        .play()
        .then(() => { setIsPlaying(true); setShowControls(true); })
        .catch((err) => console.error('[OnboardingVideoPlayer] autoplay error:', err));
    } else if (currentVideoIndex > 0) {
      setIsPlaying(false);
    }
  }, [currentVideoIndex, playbackPolicy.allowAutoplay, videos, hasError]);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      resetControlsTimeout();
    } else {
      setShowControls(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [isPlaying, resetControlsTimeout]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // ── Buffering event handlers ───────────────────────────────────────────────
  const handleWaiting  = useCallback(() => setIsBuffering(true), []);
  const handleCanPlay  = useCallback(() => {
    setIsBuffering(false);
    // Auto-play en primer video cuando el buffer está listo
    if (playbackPolicy.allowAutoplay && !isPlaying && currentVideoIndex === 0 && videoRef.current && !hasError) {
      videoRef.current.play()
        .then(() => { setIsPlaying(true); setShowControls(false); })
        .catch(() => {}); // silencio — algunos browsers requieren interacción
    }
  }, [playbackPolicy.allowAutoplay, isPlaying, currentVideoIndex, hasError]);
  const handlePlaying  = useCallback(() => { setIsBuffering(false); setIsPlaying(true); }, []);
  const handleStalled  = useCallback(() => setIsBuffering(true), []);

  // ── Progress / time ───────────────────────────────────────────────────────
  const handleTimeUpdate = useCallback(() => {
    const el = videoRef.current;
    if (!el || !el.duration || isNaN(el.duration)) return;

    const now = performance.now();
    if (now - lastProgressRenderRef.current < 250) return;
    lastProgressRenderRef.current = now;

    setCurrentTime(el.currentTime);
    setProgress((el.currentTime / el.duration) * 100);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const el = videoRef.current;
    if (el && !isNaN(el.duration)) setDuration(el.duration);
    setIsBuffering(false);
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = videoRef.current;
    if (!el || !el.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    el.currentTime = pct * el.duration;
    setProgress(pct * 100);
    setCurrentTime(pct * el.duration);
  }, []);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // ── Playback handlers ──────────────────────────────────────────────────────
  const handleVideoEnd = useCallback(() => {
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  }, [currentVideoIndex, videos.length, onComplete]);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play().catch((err) => console.error('[OnboardingVideoPlayer] play error:', err));
      setShowControls(true);
    }
  }, [isPlaying]);

  const handleInteraction = useCallback(() => {
    if (isPlaying) {
      resetControlsTimeout();
    } else {
      setShowControls(true);
    }
  }, [isPlaying, resetControlsTimeout]);

  const toggleMute = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !isMuted;
    setIsMuted((prev) => !prev);
  }, [isMuted]);

  const skipVideo  = useCallback(() => onComplete(), [onComplete]);

  const handleNext = useCallback(() => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  }, [currentVideoIndex, videos.length, onComplete]);

  const handleBack = useCallback(() => {
    if (currentVideoIndex > 0) setCurrentVideoIndex((prev) => prev - 1);
  }, [currentVideoIndex]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsBuffering(false);
    videoRef.current?.load();
  }, []);

  if (!videos || videos.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 p-3 sm:p-6"
      >
        <div 
          className="relative w-full max-w-5xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 group"
          onMouseMove={handleInteraction}
          onTouchStart={handleInteraction}
          onClick={handleInteraction}
          onMouseLeave={() => isPlaying && setShowControls(false)}
        >

          {/*
            ONE video element. Native preload is capped by the shared media
            policy so large intro files do not monopolize the connection.
          */}
          <video
            ref={videoRef}
            src={videos[currentVideoIndex]}
            preload={playbackPolicy.nativeVideoPreload}
            playsInline
            muted={isMuted}
            className={`w-full h-full object-contain ${hasError ? 'hidden' : 'block'}`}
            onEnded={handleVideoEnd}
            onLoadStart={() => setIsBuffering(true)}
            onLoadedData={() => setIsBuffering(false)}
            onWaiting={handleWaiting}
            onStalled={handleStalled}
            onCanPlay={handleCanPlay}
            onPlaying={handlePlaying}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={() => {
              setHasError(true);
              setIsBuffering(false);
            }}
            onClick={togglePlay}
          />

          {isSkippable && !hasError && (
            <button
              type="button"
              aria-label={skipIntroLabel}
              title={skipIntroLabel}
              onClick={(e) => { e.stopPropagation(); skipVideo(); }}
              className="absolute right-2 top-2 z-20 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur-sm transition-all hover:bg-black/75 active:scale-95 sm:right-4 sm:top-4 sm:px-3 sm:text-xs"
            >
              <span>{skipIntroLabel}</span>
              <SkipForward className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Error state */}
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/50 text-white p-6 text-center">
              <div className="bg-red-500/20 p-4 rounded-full mb-4">
                <VolumeX className="w-12 h-12 text-red-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('media.introPlayer.loadErrorTitle')}</h3>
              <p className="text-white/60 mb-6 max-w-md">{t('media.introPlayer.loadErrorDescription')}</p>
              <div className="flex gap-4 pointer-events-auto">
                <button
                  onClick={(e) => { e.stopPropagation(); handleRetry(); }}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all border border-white/20"
                >
                  {retryLabel}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onComplete(); }}
                  className="px-6 py-2 bg-white text-black font-bold rounded-full transition-all hover:bg-gray-200"
                >
                  {skipToContentLabel}
                </button>
              </div>
            </div>
          )}

          {/* Buffering spinner */}
          {isBuffering && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="h-12 w-12 rounded-full border-4 border-white/20 border-t-white animate-spin sm:h-16 sm:w-16" />
              {isSlowConnection && (
                <div className="mt-4 flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full">
                  <Wifi className="w-4 h-4 text-yellow-400" />
                  <span className="text-white/80 text-sm">{t('media.introPlayer.slowConnection')}</span>
                </div>
              )}
            </div>
          )}

          {/* ── Controls overlay ── */}
          {!hasError && (
            <div
              className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 pointer-events-none ${
                (showControls || !isPlaying || isBuffering) ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Top bar — gradient from top */}
              <div
                className="flex items-center justify-between gap-2 px-4 pt-4 pb-10 pointer-events-auto"
                style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
              >
                {/* Video counter (only when multiple videos) */}
                {videos.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    {videos.map((_, i) => (
                      <div
                        key={i}
                        className="h-1 rounded-full transition-all duration-300"
                        style={{
                          width: i === currentVideoIndex ? 20 : 6,
                          backgroundColor: i === currentVideoIndex ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
                        }}
                      />
                    ))}
                    <span className="text-[11px] text-white/60 ml-1">
                      {currentVideoIndex + 1} / {videos.length}
                    </span>
                  </div>
                )}

              </div>

              {/* Bottom bar — gradient from bottom */}
              <div
                className="px-4 pb-4 pt-10 pointer-events-auto"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}
              >
                {/* ── Progress bar (interactive) ── */}
                <div
                  className="w-full h-1 rounded-full cursor-pointer mb-3 group/progress"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  onClick={(e) => { e.stopPropagation(); handleSeek(e); }}
                >
                  <div
                    className="h-full rounded-full relative transition-all duration-150 group-hover/progress:scale-y-150"
                    style={{
                      width: `${progress}%`,
                      background: 'linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
                      transformOrigin: 'bottom',
                    }}
                  >
                    {/* Thumb indicator */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Controls row */}
                <div className="flex items-center gap-3">
                  {/* Play / Pause */}
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-white transition-all hover:bg-white/15 active:scale-95"
                  >
                    {isPlaying
                      ? <Pause className="w-5 h-5" />
                      : <Play className="w-5 h-5 ml-0.5" />
                    }
                  </button>

                  {/* Mute */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-white transition-all hover:bg-white/15 active:scale-95"
                  >
                    {isMuted
                      ? <VolumeX className="w-4 h-4" />
                      : <Volume2 className="w-4 h-4" />
                    }
                  </button>

                  {/* Time */}
                  {duration > 0 && (
                    <span className="text-[11px] text-white/60 tabular-nums select-none ml-0.5">
                      {fmt(currentTime)} / {fmt(duration)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Large centered play button when paused */}
          {!isPlaying && !hasError && !isBuffering && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-sm sm:h-16 sm:w-16">
                <Play className="ml-0.5 h-6 w-6 sm:h-7 sm:w-7" />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
