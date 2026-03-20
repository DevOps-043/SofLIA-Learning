'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';

interface OnboardingVideoPlayerProps {
  videos: string[];
  onComplete: () => void;
}

export function OnboardingVideoPlayer({ videos, onComplete }: OnboardingVideoPlayerProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setHasError(false);
    setVideoError(null);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.load();
      
      // Si no es el primer video, intentar reproducir automáticamente (ya hubo interacción previa)
      if (currentVideoIndex > 0) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            setIsPlaying(true);
          }).catch(error => {
            console.error("Error al reproducir automáticamente el video:", error);
          });
        }
      }
    }
  }, [currentVideoIndex, videos]);

  const handleVideoEnd = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  const skipVideo = () => {
    onComplete();
  };

  const handleNext = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex((prev) => prev - 1);
    }
  };

  if (!videos || videos.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 backdrop-blur-md"
      >
        <div className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 group">
          <video
            ref={videoRef}
            src={videos[currentVideoIndex]}
            className={`w-full h-full object-contain ${hasError ? 'hidden' : 'block'}`}
            onEnded={handleVideoEnd}
            onError={(e) => {
              const videoSrc = videos[currentVideoIndex];
              setHasError(true);
              setVideoError(`No se pudo cargar el video: ${videoSrc}. Verifica que el archivo exista en el bucket "assets".`);
            }}
            onClick={togglePlay}
            muted={isMuted}
            playsInline
          />

          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/50 text-white p-6 text-center">
              <div className="bg-red-500/20 p-4 rounded-full mb-4">
                <VolumeX className="w-12 h-12 text-red-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Error de Carga</h3>
              <p className="text-white/60 mb-6 max-w-md">{videoError}</p>
              <div className="flex gap-4 pointer-events-auto">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation();
                    setHasError(false); 
                    videoRef.current?.load(); 
                  }}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all border border-white/20"
                >
                  Reintentar
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete();
                  }}
                  className="px-6 py-2 bg-white text-black font-bold rounded-full transition-all hover:bg-gray-200"
                >
                  Saltar al Tour
                </button>
              </div>
            </div>
          )}
          
          {/* Controles Overlay */}
          {!hasError && (
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 transition-opacity duration-300 pointer-events-none flex flex-col justify-between p-6 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
            
            {/* Top Bar */}
            <div className="flex justify-between items-center w-full pointer-events-auto">
              <div className="flex items-center gap-3">
                <div className="text-white/80 text-sm font-medium bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">
                  Video {currentVideoIndex + 1} de {videos.length}
                </div>
                {/* Manual Navigation */}
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

            {/* Bottom Controls */}
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

          {/* Botón central grande si está pausado */}
          {!isPlaying && !hasError && (
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
