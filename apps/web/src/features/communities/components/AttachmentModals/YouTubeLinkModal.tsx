'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Youtube, Link, ExternalLink, CheckCircle } from 'lucide-react';

interface YouTubeLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (url: string, type: 'youtube' | 'link') => void;
  type: 'youtube' | 'link';
}

export function YouTubeLinkModal({ isOpen, onClose, onConfirm, type }: YouTubeLinkModalProps) {
  const [url, setUrl] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateUrl = (inputUrl: string) => {
    if (type === 'youtube') {
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]+/;
      return youtubeRegex.test(inputUrl);
    } else {
      const urlRegex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/;
      return urlRegex.test(inputUrl);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setIsValid(validateUrl(newUrl));
  };

  const handleConfirm = async () => {
    if (!isValid || !url) return;

    setIsLoading(true);
    try {
      // Aquí podrías hacer una validación adicional del enlace
      onConfirm(url, type);
      setUrl('');
      setIsValid(false);
      onClose();
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const getYouTubeVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const getPreviewUrl = () => {
    if (type === 'youtube' && isValid) {
      const videoId = getYouTubeVideoId(url);
      return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                  type === 'youtube' ? 'from-red-500 to-pink-500' : 'from-green-500 to-emerald-500'
                } flex items-center justify-center`}>
                  {type === 'youtube' ? (
                    <Youtube className="w-5 h-5 text-white" />
                  ) : (
                    <Link className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {type === 'youtube' ? 'Enlace de YouTube' : 'Enlace web'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    {type === 'youtube' 
                      ? 'Pega la URL del video de YouTube' 
                      : 'Pega la URL del sitio web'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* URL Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={url}
                    onChange={handleUrlChange}
                    placeholder={type === 'youtube' 
                      ? 'https://www.youtube.com/watch?v=...' 
                      : 'https://ejemplo.com'
                    }
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  />
                  {isValid && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Preview */}
              {type === 'youtube' && isValid && getPreviewUrl() && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Vista previa
                  </label>
                  <div className="relative bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                    <img
                      src={getPreviewUrl()!}
                      alt="YouTube preview"
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Youtube className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* Validation message */}
              {url && !isValid && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {type === 'youtube' 
                    ? 'Por favor, ingresa una URL válida de YouTube'
                    : 'Por favor, ingresa una URL válida'
                  }
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-900 dark:text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isValid || isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-600 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Agregar
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
