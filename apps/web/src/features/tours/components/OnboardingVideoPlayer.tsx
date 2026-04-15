'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, SkipForward, ChevronLeft, ChevronRight, Wifi } from 'lucide-react';

interface OnboardingVideoPlayerProps {
  videos: string[];
  onComplete: () => void;
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

export function OnboardingVideoPlayer({ videos, onComplete }: OnboardingVideoPlayerProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const prevVideosRef = useRef<string[]>([]);

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

    // Auto-play subsequent videos (user already interacted with video 1)
    if (videoRef.current && !hasError && currentVideoIndex > 0) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error('[OnboardingVideoPlayer] autoplay error:', err));
    }
  }, [currentVideoIndex, videos, hasError]);

  // ── Buffering event handlers ───────────────────────────────────────────────
  const handleWaiting  = useCallback(() => setIsBuffering(true), []);
  const handleCanPlay  = useCallback(() => setIsBuffering(false), []);
  const handlePlaying  = useCallback(() => { setIsBuffering(false); setIsPlaying(true); }, []);
  const handleStalled  = useCallback(() => setIsBuffering(true), []);

  // ── Playback handlers ──────────────────────────────────────────────────────
  const handleVideoEnd = useCallback(() => {
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
    }
  }, [isPlaying]);

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
        <div className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 group">

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

          {/* Controls overlay */}
          {!hasError && (
            <div
              className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 transition-opacity duration-300 pointer-events-none flex flex-col justify-between p-6 ${
                isPlaying && !isBuffering ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
              }`}
            >
              {/* Top bar */}
              <div className="flex justify-between items-center w-full pointer-events-auto">
                <div className="flex items-center gap-3">
                  <div className="text-white/80 text-sm font-medium bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">
                    Video {currentVideoIndex + 1} de {videos.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBack}
                      disabled={currentVideoIndex === 0}
                      className={`p-1.5 rounded-full backdrop-blur-md transition-all ${
                        currentVideoIndex === 0
                          ? 'text-white/20 bg-black/20 cursor-not-allowed'
                          : 'text-white/80 bg-black/40 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 text-white/80 hover:text-white bg-black/40 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all backdrop-blur-md"
                    >
                      <span className="text-sm font-medium">
                        {currentVideoIndex < videos.length - 1 ? 'Siguiente' : 'Iniciar Tour'}
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={skipVideo}
                  className="flex items-center gap-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all backdrop-blur-md"
                >
                  <span>Saltar Intro</span>
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom controls */}
              <div className="flex items-center justify-center gap-6 w-full pointer-events-auto pb-4">
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                </button>
                <button
                  onClick={toggleMute}
                  className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Large centered play button when paused */}
          {!isPlaying && !hasError && !isBuffering && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-20 h-20 flex items-center justify-center bg-black/50 rounded-full text-white backdrop-blur-md">
                <Play className="w-10 h-10 ml-2" />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
