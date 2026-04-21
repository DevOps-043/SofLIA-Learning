'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image, 
  Video, 
  File, 
  Download, 
  X, 
  Play, 
  FileText, 
  Music, 
  Archive,
  ExternalLink
} from 'lucide-react';
import { useMediaPlaybackPolicy } from '@/core/hooks/useMediaPlaybackPolicy';

interface AttachmentViewerProps {
  attachmentUrl: string;
  attachmentType: string;
  fileName?: string;
}

export function AttachmentViewer({ attachmentUrl, attachmentType, fileName }: AttachmentViewerProps) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackPolicy = useMediaPlaybackPolicy('attachment');

  useEffect(() => {
    if (!playbackPolicy.pauseWhenHidden) {
      return;
    }

    const videoElement = videoRef.current;
    if (!videoElement) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden && !videoElement.paused) {
        videoElement.pause();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [playbackPolicy.pauseWhenHidden]);

  useEffect(() => {
    if (
      !playbackPolicy.pauseWhenOutsideViewport ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }

    const videoElement = videoRef.current;
    if (!videoElement) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && !entry.isIntersecting && !videoElement.paused) {
          videoElement.pause();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(videoElement);

    return () => {
      observer.disconnect();
    };
  }, [playbackPolicy.pauseWhenOutsideViewport, attachmentUrl]);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('pdf') || type.includes('document')) return FileText;
    if (type.includes('zip') || type.includes('rar')) return Archive;
    return File;
  };

  const getFileTypeColor = (type: string) => {
    if (type.startsWith('image/')) return 'text-green-600 dark:text-green-400';
    if (type.startsWith('video/')) return 'text-red-600 dark:text-red-400';
    if (type.startsWith('audio/')) return 'text-purple-600 dark:text-purple-400';
    if (type.includes('pdf') || type.includes('document')) return 'text-blue-600 dark:text-blue-400';
    if (type.includes('zip') || type.includes('rar')) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-slate-400';
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = attachmentUrl;
    link.download = fileName || 'archivo';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(attachmentUrl, '_blank');
  };

  const FileIcon = getFileIcon(attachmentType);
  const fileTypeColor = getFileTypeColor(attachmentType);

  if (attachmentType.startsWith('image/')) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative group cursor-pointer"
          onClick={() => setShowFullscreen(true)}
        >
          <div className="relative overflow-hidden rounded-xl bg-gray-100 dark:bg-slate-800">
            {!imageError ? (
              <img
                src={attachmentUrl}
                alt={fileName || 'Imagen adjunta'}
                className="w-full h-auto max-h-96 object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex items-center justify-center h-48 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400">
                <div className="text-center">
                  <Image className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-gray-900 dark:text-white">Error al cargar la imagen</p>
                </div>
              </div>
            )}
            
            {/* Overlay con información */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-black/50 backdrop-blur-sm rounded-full p-3">
                  <Image className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Modal de imagen en pantalla completa */}
        <AnimatePresence>
          {showFullscreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
              onClick={() => setShowFullscreen(false)}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="relative max-w-7xl max-h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={attachmentUrl}
                  alt={fileName || 'Imagen adjunta'}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
                <button
                  onClick={() => setShowFullscreen(false)}
                  className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  if (attachmentType.startsWith('video/')) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative group"
      >
        <div className="relative overflow-hidden rounded-xl bg-gray-100 dark:bg-slate-800">
          <video
            ref={videoRef}
            src={attachmentUrl}
            controls
            className="w-full h-auto max-h-96"
            playsInline
            poster=""
            preload={playbackPolicy.nativeVideoPreload}
          >
            Tu navegador no soporta el elemento de video.
          </video>
          
          {/* Overlay con controles adicionales */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={handleDownload}
              className="bg-black/50 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/70 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleOpenInNewTab}
              className="bg-black/50 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/70 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Para otros tipos de archivos
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-100 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-600/50 rounded-xl p-4 hover:bg-gray-200 dark:hover:bg-slate-700/50 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg bg-gray-200 dark:bg-slate-700/50 ${fileTypeColor}`}>
          <FileIcon className="w-8 h-8" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-gray-900 dark:text-white font-medium truncate">
            {fileName || 'Archivo adjunto'}
          </h4>
          <p className="text-gray-600 dark:text-slate-400 text-sm">
            {attachmentType}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleOpenInNewTab}
            className="p-2 rounded-lg bg-gray-200 dark:bg-slate-700/50 hover:bg-gray-300 dark:hover:bg-slate-600/50 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Abrir en nueva pestaña"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg bg-blue-600/50 dark:bg-blue-600/50 hover:bg-blue-600 text-blue-300 dark:text-blue-300 hover:text-white transition-colors"
            title="Descargar"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
