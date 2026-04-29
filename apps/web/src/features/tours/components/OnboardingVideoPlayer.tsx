'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, SkipForward, Wifi } from 'lucide-react';
import { useMediaPlaybackPolicy } from '@/core/hooks/useMediaPlaybackPolicy';

interface OnboardingVideoPlayerProps {
  videos: string[];
  onComplete: () => void;
  /** Cuando false, oculta el botón "Saltar Intro" para forzar ver el video completo. Default: true */
  isSkippable?: boolean;
}

// ---------------------------------------------------------------------------
// HTTP-level prefetch — primes the browser cache without activating a video
// decoder. Inserting <link rel="prefetch"> tells the browser to download the
// resource at idle priority using only the HTTP stack; no codec or hardware
// video decoder is allocated.
//
// Previous approach: a hidden <video preload="auto"> element
// Problem: that allocated a SECOND hardware video decoder simultaneously with
// the main player → doubled power draw → device overheating on mobile.
// ---------------------------------------------------------------------------
function injectPrefetchLink(url: string): () => void {
  if (typeof document === 'undefined') return () => {};

  const selector = `link[rel="prefetch"][href="${url}"]`;
  if (document.head.querySelector(selector)) return () => {};

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.setAttribute('as', 'fetch');
  link.href = url;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);

  return () => {
    if (document.head.contains(link)) document.head.removeChild(link);
  };
}

export function OnboardingVideoPlayer({ videos, onComplete, isSkippable = true }: OnboardingVideoPlayerProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);    // 0–100
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const prevVideosRef = useRef<string[]>([]);
  const playbackPolicy = useMediaPlaybackPolicy('tour');

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

  // ── HTTP-level prefetch for the next video ────────────────────────────────
  // Uses <link rel="prefetch"> (HTTP cache, no decoder) instead of a hidden
  // <video> element so only ONE hardware decoder is ever active at a time.
  // Prefetch del video siguiente (ya existía)
  useEffect(() => {
    const nextUrl = videos[currentVideoIndex + 1];
    if (!nextUrl) return;
    return injectPrefetchLink(nextUrl);
  }, [currentVideoIndex, videos]);

  // ── Reload player when video list changes ─────────────────────────────────
  useEffect(() => {
    const videosChanged =
      JSON.stringify(videos) !== JSON.stringify(prevVideosRef.current);

    if (videosChanged) {
      setHasError(false);
      setVideoError(null);
      setIsPlaying(false);
      setIsBuffering(false);
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
    if (!isPlaying && currentVideoIndex === 0 && videoRef.current && !hasError) {
      videoRef.current.play()
        .then(() => { setIsPlaying(true); setShowControls(false); })
        .catch(() => {}); // silencio — algunos browsers requieren interacción
    }
  }, [isPlaying, currentVideoIndex, hasError]);
  const handlePlaying  = useCallback(() => { setIsBuffering(false); setIsPlaying(true); }, []);
  const handleStalled  = useCallback(() => setIsBuffering(true), []);

  // ── Progress / time ───────────────────────────────────────────────────────
  const handleTimeUpdate = useCallback(() => {
    const el = videoRef.current;
    if (!el || !el.duration || isNaN(el.duration)) return;
    setCurrentTime(el.currentTime);
    setProgress((el.currentTime / el.duration) * 100);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const el = videoRef.current;
    if (el && !isNaN(el.duration)) setDuration(el.duration);
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
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 backdrop-blur-md"
      >
        <div 
          className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 group"
          onMouseMove={handleInteraction}
          onTouchStart={handleInteraction}
          onClick={handleInteraction}
          onMouseLeave={() => isPlaying && setShowControls(false)}
        >

          {/*
            ONE video element with preload="auto".
            The next video is prefetched via <link rel="prefetch"> (HTTP-only,
            no decoder), NOT via a second <video> element.
          */}
          <video
            ref={videoRef}
            src={videos[currentVideoIndex]}
            preload="auto"
            playsInline
            muted={isMuted}
            className={`w-full h-full object-contain ${hasError ? 'hidden' : 'block'}`}
            onEnded={handleVideoEnd}
            onWaiting={handleWaiting}
            onStalled={handleStalled}
            onCanPlay={handleCanPlay}
            onPlaying={handlePlaying}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={() => {
              setHasError(true);
              setIsBuffering(false);
              setVideoError(
                `No se pudo cargar el video: ${videos[currentVideoIndex]}. ` +
                'Verifica que el archivo exista en el bucket "assets".'
              );
            }}
            onClick={togglePlay}
          />

          {/* Error state */}
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/50 text-white p-6 text-center">
              <div className="bg-red-500/20 p-4 rounded-full mb-4">
                <VolumeX className="w-12 h-12 text-red-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Error de Carga</h3>
              <p className="text-white/60 mb-6 max-w-md">{videoError}</p>
              <div className="flex gap-4 pointer-events-auto">
                <button
                  onClick={(e) => { e.stopPropagation(); handleRetry(); }}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all border border-white/20"
                >
                  Reintentar
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onComplete(); }}
                  className="px-6 py-2 bg-white text-black font-bold rounded-full transition-all hover:bg-gray-200"
                >
                  Saltar al Tour
                </button>
              </div>
            </div>
          )}

          {/* Buffering spinner */}
          {isBuffering && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white animate-spin" />
              {isSlowConnection && (
                <div className="mt-4 flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full">
                  <Wifi className="w-4 h-4 text-yellow-400" />
                  <span className="text-white/80 text-sm">Conexión lenta — cargando…</span>
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

                {/* Saltar Intro */}
                {isSkippable && (
                  <button
                    onClick={(e) => { e.stopPropagation(); skipVideo(); }}
                    className="ml-auto flex items-center gap-1.5 text-white/75 hover:text-white bg-black/30 hover:bg-black/50 px-3 py-1.5 rounded-full transition-all text-xs font-semibold backdrop-blur-sm border border-white/10"
                  >
                    <span>Saltar Intro</span>
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
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
              <div className="w-16 h-16 flex items-center justify-center bg-black/40 rounded-full text-white backdrop-blur-sm border border-white/10">
                <Play className="w-7 h-7 ml-0.5" />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
