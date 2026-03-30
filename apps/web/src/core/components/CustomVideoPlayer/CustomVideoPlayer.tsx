'use client';

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  PictureInPicture,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useVideoTracking } from '@/features/video-tracking';

interface CustomVideoPlayerProps {
  src: string;
  title?: string;
  className?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onPiPChange?: (isPiP: boolean) => void;
  initialTime?: number;
  initialPlaybackRate?: number;
  // Video tracking props
  lessonId?: string;
  trackingId?: string;
  onTrackingError?: (error: Error) => void;
}

// Interfaz para exponer métodos del reproductor
export interface CustomVideoPlayerRef {
  requestPiP: () => Promise<void>;
  exitPiP: () => Promise<void>;
  isPlaying: () => boolean;
  isPiPActive: () => boolean;
  getVideoElement: () => HTMLVideoElement | null;
}

export const CustomVideoPlayer = forwardRef<CustomVideoPlayerRef, CustomVideoPlayerProps>(({
  src,
  title,
  className = '',
  onProgress,
  onComplete,
  onPiPChange,
  initialTime = 0,
  initialPlaybackRate = 1,
  lessonId,
  trackingId,
  onTrackingError
}, ref) => {
  // 🐛 DEBUG: SYNC log (runs immediately, before any hooks)

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(initialPlaybackRate);
  const [showSettings, setShowSettings] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [hasInitialTimeSet, setHasInitialTimeSet] = useState(false);

  // 🎯 Video Tracking Hook
  const tracking = lessonId ? useVideoTracking({
    lessonId,
    trackingId,
    onError: onTrackingError
  }) : null;

  // 🔧 Use ref to keep tracking handlers stable across renders
  const trackingRef = useRef(tracking);
  useEffect(() => {
    trackingRef.current = tracking;
  }, [tracking]);

  // 🐛 DEBUG: Log tracking status
  useEffect(() => {
    if (lessonId) {
    } else {
    }
  }, [lessonId]);

  // 🎯 Connect video events to tracking hook
  useEffect(() => {
    const video = videoRef.current;

    // 🐛 DEBUG: Log event listener setup status

    if (!video || !lessonId) {
      return;
    }


    const handlePlayEvent = () => {
      trackingRef.current?.handlePlay(video.currentTime, video.duration, video.playbackRate);
    };

    const handlePauseEvent = () => {
      trackingRef.current?.handlePause(video.currentTime, video.duration, video.playbackRate);
    };

    const handleEndedEvent = () => {
      trackingRef.current?.handleEnded(video.currentTime, video.duration, video.playbackRate);
    };

    const handleSeekedEvent = () => {
      trackingRef.current?.handleSeeked(video.currentTime, video.duration, video.playbackRate);
    };

    const handleTimeUpdateEvent = () => {
      trackingRef.current?.handleTimeUpdate(video.currentTime, video.duration, video.playbackRate);
    };

    const handleRateChangeEvent = () => {
      trackingRef.current?.handleRateChange(video.currentTime, video.duration, video.playbackRate);
    };

    // Add event listeners
    video.addEventListener('play', handlePlayEvent);
    video.addEventListener('pause', handlePauseEvent);
    video.addEventListener('ended', handleEndedEvent);
    video.addEventListener('seeked', handleSeekedEvent);
    video.addEventListener('timeupdate', handleTimeUpdateEvent);
    video.addEventListener('ratechange', handleRateChangeEvent);

    // Cleanup on unmount
    return () => {
      trackingRef.current?.cleanup();
      video.removeEventListener('play', handlePlayEvent);
      video.removeEventListener('pause', handlePauseEvent);
      video.removeEventListener('ended', handleEndedEvent);
      video.removeEventListener('seeked', handleSeekedEvent);
      video.removeEventListener('timeupdate', handleTimeUpdateEvent);
      video.removeEventListener('ratechange', handleRateChangeEvent);
    };
  }, [lessonId]); // Use lessonId as stable dependency instead of tracking object

  // 🔧 CRITICAL FIX: Cleanup effect to pause video on component unmount
  // This prevents the "double audio" bug when navigating away from the video
  // BUT: If video is in PiP mode, let it continue playing (YouTube-style behavior)
  useEffect(() => {
    const video = videoRef.current;

    return () => {
      if (video) {
        // Check if video is currently in Picture-in-Picture mode
        const isInPiP = document.pictureInPictureElement === video;

        // If video is in PiP, DON'T pause or exit - let it continue playing
        // This enables YouTube-style behavior where PiP continues when switching tabs
        if (!isInPiP) {
          video.pause();
        }
        // Note: We no longer exit PiP on unmount - the video should keep playing in PiP
      }
    };
  }, []);

  // 🔧 FIX: Pause video when src changes (lesson change)
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Reset states when source changes
      setIsPlaying(false);
      setCurrentTime(0);
      setIsLoading(true);
      setIsBuffering(false);
    }
  }, [src]);

  // Exponer métodos al componente padre mediante useImperativeHandle
  useImperativeHandle(ref, () => ({
    requestPiP: async () => {
      const video = videoRef.current;
      if (!video || document.pictureInPictureElement) return;

      try {
        await video.requestPictureInPicture();
        setIsPiP(true);
        onPiPChange?.(true);
      } catch (error) {
        console.error('Error al activar Picture-in-Picture:', error);
      }
    },
    exitPiP: async () => {
      if (document.pictureInPictureElement) {
        try {
          await document.exitPictureInPicture();
          setIsPiP(false);
          onPiPChange?.(false);
        } catch (error) {
          console.error('Error al salir de Picture-in-Picture:', error);
        }
      }
    },
    isPlaying: () => isPlaying,
    isPiPActive: () => isPiP,
    getVideoElement: () => videoRef.current
  }), [isPlaying, isPiP, onPiPChange]);

  // Escuchar eventos de PiP
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnterPiP = () => {
      setIsPiP(true);
      onPiPChange?.(true);
    };

    const handleLeavePiP = () => {
      setIsPiP(false);
      onPiPChange?.(false);

      // 🔧 CRITICAL FIX: When PiP closes (by any means - user clicking X, expand button, etc.)
      // We need to handle this properly:
      // 1. If the video element is still in the DOM and visible, sync the playing state
      // 2. If the video element is NOT visible (user is on another tab), pause it to prevent audio leak

      // Check if the video container is visible in the viewport
      const videoContainer = video.closest('.aspect-video');
      const isVideoVisible = videoContainer && videoContainer.getBoundingClientRect().height > 0;

      if (!isVideoVisible && !video.paused) {
        // Video is not visible but still playing - this causes the audio leak bug
        // Pause it immediately
        video.pause();
        if (process.env.NODE_ENV === 'development') {
        }
      } else {
        // Video is visible, sync the isPlaying state with actual video state
        setIsPlaying(!video.paused);
      }
    };

    video.addEventListener('enterpictureinpicture', handleEnterPiP);
    video.addEventListener('leavepictureinpicture', handleLeavePiP);

    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPiP);
      video.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, [onPiPChange]);

  // Ocultar controles automáticamente después de 3 segundos
  useEffect(() => {
    if (!isHovering && isPlaying && showControls) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isHovering, isPlaying, showControls]);

  // Mostrar controles al hacer hover
  useEffect(() => {
    if (isHovering) {
      setShowControls(true);
    }
  }, [isHovering]);

  // Actualizar tiempo actual
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 🔧 FIX: Debounce buffering state to prevent flickering
    let bufferingTimeout: ReturnType<typeof setTimeout> | null = null;
    const BUFFERING_DELAY = 300; // Only show buffering indicator after 300ms

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      if (onProgress && duration > 0) {
        onProgress((video.currentTime / duration) * 100);
      }
    };

    const updateDuration = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onComplete) {
        onComplete();
      }
    };

    const handleWaiting = () => {
      // Clear any pending timeout
      if (bufferingTimeout) {
        clearTimeout(bufferingTimeout);
      }
      // Only show buffering after a delay to avoid flickering
      bufferingTimeout = setTimeout(() => {
        setIsBuffering(true);
      }, BUFFERING_DELAY);
    };

    const handleCanPlay = () => {
      // Clear pending buffering timeout
      if (bufferingTimeout) {
        clearTimeout(bufferingTimeout);
        bufferingTimeout = null;
      }
      setIsBuffering(false);
      setIsLoading(false);

      // Aplicar tiempo inicial si no se ha aplicado aún
      if (!hasInitialTimeSet && initialTime > 0) {
        video.currentTime = initialTime;
        setHasInitialTimeSet(true);
      }

      // Aplicar velocidad inicial
      if (Math.abs(video.playbackRate - initialPlaybackRate) > 0.01) {
        video.playbackRate = initialPlaybackRate;
      }
    };

    const handleLoadedMetadata = () => {
      updateDuration();
      // Aplicar tiempo inicial también en loadedmetadata por si acaso
      if (!hasInitialTimeSet && initialTime > 0) {
        video.currentTime = initialTime;
        setHasInitialTimeSet(true);
      }

      // Aplicar velocidad inicial
      if (Math.abs(video.playbackRate - initialPlaybackRate) > 0.01) {
        video.playbackRate = initialPlaybackRate;
      }
    };

    const handlePlaying = () => {
      // Clear pending buffering timeout
      if (bufferingTimeout) {
        clearTimeout(bufferingTimeout);
        bufferingTimeout = null;
      }
      setIsBuffering(false);
    };

    // 🔧 FIX: Sync isPlaying state with native video events
    const handleNativePlay = () => {
      setIsPlaying(true);
    };

    const handleNativePause = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('play', handleNativePlay);
    video.addEventListener('pause', handleNativePause);

    return () => {
      // Clear any pending buffering timeout
      if (bufferingTimeout) {
        clearTimeout(bufferingTimeout);
      }
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('play', handleNativePlay);
      video.removeEventListener('pause', handleNativePause);
    };
  }, [duration, onProgress, onComplete, initialTime, initialPlaybackRate, hasInitialTimeSet]);

  // Manejar fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);

      // 🔧 FIX: Ensure video continues playing after fullscreen change
      const video = videoRef.current;
      if (video && isPlaying && video.paused) {
        video.play().catch(() => {
          // Autoplay may be blocked, user needs to click play
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    // Also handle webkit prefix for Safari
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isPlaying]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        // 🔧 FIX: Handle play promise properly
        await video.play();
        setIsPlaying(true);
      }
    } catch (error) {
      // Play was interrupted or blocked
      console.warn('Play interrupted:', error);
      setIsPlaying(false);
    }
    setShowControls(true);
  };

  // Función para actualizar el progreso del video
  const updateProgress = (clientX: number) => {
    const video = videoRef.current;
    const progressBar = progressBarRef.current;
    if (!video || !progressBar || duration === 0) return;

    const rect = progressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    video.currentTime = percent * duration;
    setCurrentTime(percent * duration);
  };

  // Función para actualizar el volumen
  const updateVolume = (clientY: number) => {
    const video = videoRef.current;
    const volumeBar = volumeBarRef.current;
    if (!video || !volumeBar) return;

    const rect = volumeBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (rect.bottom - clientY) / rect.height));
    const newVolume = Math.max(0, Math.min(1, percent));
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Handlers para la barra de progreso
  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingProgress(true);
    updateProgress(e.clientX);
    setShowControls(true);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingProgress) {
      e.preventDefault();
      updateProgress(e.clientX);
    }
  };

  const handleProgressMouseUp = () => {
    setIsDraggingProgress(false);
  };

  // Handlers para la barra de volumen
  const handleVolumeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingVolume(true);
    updateVolume(e.clientY);
    setShowVolumeControl(true);
  };

  const handleVolumeMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingVolume) {
      e.preventDefault();
      updateVolume(e.clientY);
    }
  };

  const handleVolumeMouseUp = () => {
    setIsDraggingVolume(false);
  };

  // Handlers para touch events (móviles)
  const handleProgressTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingProgress(true);
    const touch = e.touches[0];
    if (touch) updateProgress(touch.clientX);
    setShowControls(true);
  };

  const handleProgressTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isDraggingProgress) {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) updateProgress(touch.clientX);
    }
  };

  const handleProgressTouchEnd = () => {
    setIsDraggingProgress(false);
  };

  const handleVolumeTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingVolume(true);
    const touch = e.touches[0];
    if (touch) updateVolume(touch.clientY);
    setShowVolumeControl(true);
  };

  const handleVolumeTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isDraggingVolume) {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) updateVolume(touch.clientY);
    }
  };

  const handleVolumeTouchEnd = () => {
    setIsDraggingVolume(false);
  };

  // Handlers globales para mouse move y up (para arrastrar fuera del elemento)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingProgress) {
        e.preventDefault();
        updateProgress(e.clientX);
      }
      if (isDraggingVolume) {
        e.preventDefault();
        updateVolume(e.clientY);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingProgress(false);
      setIsDraggingVolume(false);
    };

    if (isDraggingProgress || isDraggingVolume) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [isDraggingProgress, isDraggingVolume]);

  // Handlers para click (fallback si no se está arrastrando)
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingProgress) {
      updateProgress(e.clientX);
      setShowControls(true);
    }
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingVolume) {
      updateVolume(e.clientY);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
    setShowControls(true);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!isFullscreen) {
        // Request fullscreen with error handling
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else {
          // Safari fallback
          const webkitContainer = container as unknown as { webkitRequestFullscreen?: () => Promise<void> };
          if (webkitContainer.webkitRequestFullscreen) {
            await webkitContainer.webkitRequestFullscreen();
          }
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else {
          // Safari fallback
          const webkitDocument = document as unknown as { webkitExitFullscreen?: () => Promise<void> };
          if (webkitDocument.webkitExitFullscreen) {
            await webkitDocument.webkitExitFullscreen();
          }
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
      // Force sync the fullscreen state with actual state
      setIsFullscreen(!!document.fullscreenElement);
    }
    setShowControls(true);
  };

  const togglePictureInPicture = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
      setShowSettings(false);
      setShowControls(true);
    } catch (error) {
      console.error('Error con Picture-in-Picture:', error);
    }
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
    setShowControls(true);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
    setShowControls(true);
  };

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-[#0F1419] dark:bg-[#0F1419] rounded-xl overflow-hidden group ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={() => setShowControls(true)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        playsInline
        preload="auto"
        onClick={togglePlay}
        onError={(e) => {
          console.error('Video error:', e);
          setIsLoading(false);
          setIsBuffering(false);
        }}
        onLoadStart={() => {
          setIsLoading(true);
        }}
        onLoadedData={() => {
          setIsLoading(false);
        }}
      />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0F1419]/80 backdrop-blur-sm z-30">
          <div className="w-12 h-12 border-4 border-[#00D4B3]/20 border-t-[#00D4B3] rounded-full animate-spin" />
        </div>
      )}

      {/* Buffering Indicator */}
      {isBuffering && isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0F1419]/50 z-20">
          <div className="w-12 h-12 border-4 border-[#00D4B3]/20 border-t-[#00D4B3] rounded-full animate-spin" />
        </div>
      )}

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-40 pointer-events-none"
          >
            {/* Top Controls - Botones de navegación rápida */}
            <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
              <button
                onClick={() => skip(-10)}
                className="p-1.5 sm:p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-lg transition-all duration-200 group/btn"
                title="Retroceder 10s"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover/btn:scale-110 transition-transform" />
                <span className="absolute -bottom-7 sm:-bottom-8 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs text-white bg-black/80 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">
                  10s
                </span>
              </button>
              <button
                onClick={() => skip(10)}
                className="p-1.5 sm:p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-lg transition-all duration-200 group/btn"
                title="Avanzar 10s"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover/btn:scale-110 transition-transform" />
                <span className="absolute -bottom-7 sm:-bottom-8 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs text-white bg-black/80 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">
                  10s
                </span>
              </button>
            </div>

            {/* Center Play Button */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={togglePlay}
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-200 pointer-events-auto group"
                >
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white group-hover:scale-110 transition-transform ml-0.5" />
                </motion.button>
              </div>
            )}

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4 pointer-events-auto">
              {/* Progress Bar */}
              <div
                ref={progressBarRef}
                onClick={handleProgressClick}
                onMouseDown={handleProgressMouseDown}
                onMouseMove={handleProgressMouseMove}
                onMouseUp={handleProgressMouseUp}
                onMouseLeave={handleProgressMouseUp}
                onTouchStart={handleProgressTouchStart}
                onTouchMove={handleProgressTouchMove}
                onTouchEnd={handleProgressTouchEnd}
                className={`w-full h-1 sm:h-1.5 bg-white/20 rounded-full mb-2 sm:mb-3 md:mb-4 cursor-pointer group/progress hover:h-2 transition-all duration-200 ${isDraggingProgress ? 'h-2' : ''
                  }`}
                style={{ userSelect: 'none' }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-[#00D4B3] to-[#00b89a] rounded-full relative" /* Aqua para barra de progreso */
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  initial={false}
                >
                  <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full transition-opacity shadow-lg ${isDraggingProgress || isHovering ? 'opacity-100' : 'opacity-0 group-hover/progress:opacity-100'
                    }`} />
                </motion.div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                  {/* Play/Pause */}
                  <button
                    onClick={togglePlay}
                    className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
                    title={isPlaying ? 'Pausar' : 'Reproducir'}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
                    ) : (
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
                    )}
                  </button>

                  {/* Volume Control */}
                  <div
                    className="relative"
                    onMouseEnter={() => setShowVolumeControl(true)}
                    onMouseLeave={() => setShowVolumeControl(false)}
                  >
                    <button
                      onClick={toggleMute}
                      className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
                      title={isMuted ? 'Activar sonido' : 'Silenciar'}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
                      ) : (
                        <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
                      )}
                    </button>

                    {/* Volume Slider */}
                    <AnimatePresence>
                      {showVolumeControl && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-black/80 backdrop-blur-md rounded-lg"
                        >
                          <div
                            ref={volumeBarRef}
                            onClick={handleVolumeClick}
                            onMouseDown={handleVolumeMouseDown}
                            onMouseMove={handleVolumeMouseMove}
                            onMouseUp={handleVolumeMouseUp}
                            onMouseLeave={handleVolumeMouseUp}
                            onTouchStart={handleVolumeTouchStart}
                            onTouchMove={handleVolumeTouchMove}
                            onTouchEnd={handleVolumeTouchEnd}
                            className="w-2 h-20 bg-white/20 rounded-full cursor-pointer relative"
                            style={{ userSelect: 'none' }}
                          >
                            <motion.div
                              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#00D4B3] to-[#00b89a] rounded-full"
                              style={{ height: `${(isMuted ? 0 : volume) * 100}%` }}
                              initial={false}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Time Display */}
                  <div className="text-white text-xs sm:text-sm font-medium tabular-nums">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  {/* Settings Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
                      title="Configuración"
                    >
                      <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
                    </button>

                    {/* Settings Dropdown */}
                    <AnimatePresence>
                      {showSettings && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-full right-0 mb-2 w-40 sm:w-48 bg-black/90 backdrop-blur-md rounded-lg shadow-xl border border-white/10 overflow-hidden"
                        >
                          {/* Velocidad de reproducción */}
                          <div className="p-2 border-b border-white/10">
                            <div className="px-3 py-2 text-xs font-medium text-white/70 uppercase tracking-wider">
                              Velocidad de reproducción
                            </div>
                            <div className="space-y-1">
                              {playbackRates.map((rate) => (
                                <button
                                  key={rate}
                                  onClick={() => changePlaybackRate(rate)}
                                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-200 ${playbackRate === rate
                                    ? 'bg-[#00D4B3]/20 text-[#00D4B3] font-medium'
                                    : 'text-white/80 hover:bg-white/10'
                                    }`}
                                >
                                  {rate === 1 ? 'Normal' : `${rate}x`}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Imagen en imagen */}
                          <button
                            onClick={togglePictureInPicture}
                            className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-all duration-200 flex items-center gap-2"
                          >
                            <PictureInPicture className="w-4 h-4" />
                            Imagen en imagen
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
                    title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                  >
                    {isFullscreen ? (
                      <Minimize className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
                    ) : (
                      <Maximize className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// Añadir displayName para debugging
CustomVideoPlayer.displayName = 'CustomVideoPlayer';
