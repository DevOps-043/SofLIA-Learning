'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

// Interfaz para el contexto del VideoPlayer
interface VideoPlayerContextType {
  isVideoPlaying: boolean;
  isPiPActive: boolean;
  shouldAutoPlay: boolean; // Flag to auto-play video when returning from PiP
  setIsVideoPlaying: (playing: boolean) => void;
  setIsPiPActive: (active: boolean) => void;
  setShouldAutoPlay: (autoPlay: boolean) => void;
  requestPiP: () => Promise<void>;
  exitPiP: () => Promise<void>;
  getVideoProgress: (lessonId: string) => number;
  saveVideoProgress: (lessonId: string, time: number) => void;
  pauseAllVideos: () => void;
  // Ref-based flag for immediate reading (not subject to React state batching)
  shouldAutoPlayRef: React.MutableRefObject<boolean>;
}

// Crear el contexto
const VideoPlayerContext = createContext<VideoPlayerContextType | null>(null);

// Provider del contexto
export function VideoPlayerProvider({ children }: { children: React.ReactNode }) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false); // Auto-play after returning from PiP
  // Ref for immediate reading (not subject to React state batching)
  const shouldAutoPlayRef = useRef(false);
  // Mapa de progreso por lección: { lessonId: currentTime }
  const [videoProgress, setVideoProgress] = useState<Record<string, number>>({});

  // Función para activar PiP - busca el elemento video en el DOM
  const requestPiP = useCallback(async () => {
    // Si ya está en PiP, no hacer nada
    if (isPiPActive || document.pictureInPictureElement) {
      return;
    }

    try {
      // Buscar el elemento video en el DOM
      const videoElement = document.querySelector('video');
      if (videoElement && !videoElement.paused) {
        await videoElement.requestPictureInPicture();
        setIsPiPActive(true);
      }
    } catch (error) {
    }
  }, [isPiPActive]);

  // Función para salir de PiP
  const exitPiP = useCallback(async () => {
    if (document.pictureInPictureElement) {
      try {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } catch (error) {
      }
    }
  }, []);

  const saveVideoProgress = useCallback((lessonId: string, time: number) => {
    setVideoProgress((prev) => ({ ...prev, [lessonId]: time }));
  }, []);

  const getVideoProgress = useCallback((lessonId: string) => {
    return videoProgress[lessonId] || 0;
  }, [videoProgress]);

  // 🔧 FIX: Function to pause all videos on the page
  // This prevents double audio when navigating between lessons
  // BUT: Don't pause videos that are in Picture-in-Picture mode (YouTube-style behavior)
  const pauseAllVideos = useCallback(() => {
    const videos = document.querySelectorAll('video');
    const pipElement = document.pictureInPictureElement;

    videos.forEach((video) => {
      // Don't pause if this video is in PiP mode
      if (!video.paused && video !== pipElement) {
        video.pause();
      }
    });

    // Only set isVideoPlaying to false if no video is in PiP
    if (!pipElement) {
      setIsVideoPlaying(false);
    }
  }, []);

  // 🔧 CRITICAL: Global listener for PiP exit events
  // This handles the case when user closes PiP using native controls (X button, expand button, etc.)
  // while the VideoContent component is not mounted (user is on another tab)
  useEffect(() => {
    const handleGlobalLeavePiP = (event: Event) => {
      const video = event.target as HTMLVideoElement;

      // Check if the video container is visible
      const videoContainer = video.closest('.aspect-video');
      const isVideoVisible = videoContainer && videoContainer.getBoundingClientRect().height > 0;

      if (process.env.NODE_ENV === 'development') {
      }

      // Update PiP state
      setIsPiPActive(false);

      // If video is not visible and still playing, pause it to prevent audio leak
      if (!isVideoVisible && !video.paused) {
        video.pause();
        setIsVideoPlaying(false);
        if (process.env.NODE_ENV === 'development') {
        }
      }
    };

    // Listen for leavepictureinpicture on document (captures all video elements)
    document.addEventListener('leavepictureinpicture', handleGlobalLeavePiP, true);

    return () => {
      document.removeEventListener('leavepictureinpicture', handleGlobalLeavePiP, true);
    };
  }, []);

  // Custom setter that updates both state and ref
  const setShouldAutoPlayWithRef = useCallback((value: boolean) => {
    shouldAutoPlayRef.current = value;
    setShouldAutoPlay(value);
  }, []);

  return (
    <VideoPlayerContext.Provider
      value={{
        isVideoPlaying,
        isPiPActive,
        shouldAutoPlay,
        setIsVideoPlaying,
        setIsPiPActive,
        setShouldAutoPlay: setShouldAutoPlayWithRef,
        requestPiP,
        exitPiP,
        getVideoProgress,
        saveVideoProgress,
        pauseAllVideos,
        shouldAutoPlayRef,
      }}
    >
      {children}
    </VideoPlayerContext.Provider>
  );
}

// Hook para usar el contexto
export function useVideoPlayer() {
  const context = useContext(VideoPlayerContext);
  if (!context) {
    throw new Error('useVideoPlayer must be used within a VideoPlayerProvider');
  }
  return context;
}

// Hook opcional que no lanza error si no está en el provider
export function useVideoPlayerOptional() {
  return useContext(VideoPlayerContext);
}
