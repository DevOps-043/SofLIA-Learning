'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, SkipForward } from 'lucide-react';

interface OnboardingVideoPlayerProps {
  videos: string[];
  onComplete: () => void;
}

export function OnboardingVideoPlayer({ videos, onComplete }: OnboardingVideoPlayerProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((e) => {
        console.warn('Autoplay prevented:', e);
        setIsPlaying(false);
      });
    }
  }, [currentVideoIndex]);

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
            className="w-full h-full object-contain"
            onEnded={handleVideoEnd}
            onClick={togglePlay}
            autoPlay
            playsInline
          />
          
          {/* Controles Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex flex-col justify-between p-6">
            
            {/* Top Bar */}
            <div className="flex justify-between items-center w-full pointer-events-auto">
              <div className="text-white/80 text-sm font-medium bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">
                Video {currentVideoIndex + 1} de {videos.length}
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
          
          {/* Botón central grande si está pausado */}
          {!isPlaying && (
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
