'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ExternalLink } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName?: string;
  imageData?: any;
}

export function ImageModal({ isOpen, onClose, imageUrl, imageName, imageData }: ImageModalProps) {
  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageName || 'imagen';
    link.click();
  };

  const handleOpenExternal = () => {
    window.open(imageUrl, '_blank');
  };

  const isBase64 = imageUrl.startsWith('data:');
  const isExternalUrl = imageUrl.startsWith('http');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
        >
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative max-w-[95vw] max-h-[95vh] bg-slate-900 rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-slate-800/50 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">
                    {imageName || 'Imagen'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isBase64 ? 'Imagen adjunta' : 'Imagen externa'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Botón de descarga */}
                <button
                  onClick={handleDownload}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                  title="Descargar imagen"
                >
                  <Download className="w-4 h-4" />
                </button>
                
                {/* Botón de abrir externo (solo para URLs externas) */}
                {isExternalUrl && (
                  <button
                    onClick={handleOpenExternal}
                    className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                    title="Abrir en nueva pestaña"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
                
                {/* Botón de cerrar */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Imagen */}
            <div className="relative flex items-center justify-center p-4">
              <motion.img
                src={imageUrl}
                alt={imageName || 'Imagen'}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  // Mostrar placeholder de error
                  const placeholder = document.createElement('div');
                  placeholder.className = 'w-96 h-64 bg-slate-700 rounded-lg flex items-center justify-center';
                  placeholder.innerHTML = `
                    <div class="text-center">
                      <svg class="w-12 h-12 text-slate-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
                      </svg>
                      <p class="text-slate-400 text-sm">Error al cargar imagen</p>
                    </div>
                  `;
                  e.currentTarget.parentNode?.appendChild(placeholder);
                }}
              />
            </div>

            {/* Footer con información adicional */}
            {imageData && (
              <div className="p-4 bg-slate-800/30 border-t border-slate-700">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {imageData.size ? `Tamaño: ${formatFileSize(imageData.size)}` : 'Imagen adjunta'}
                  </span>
                  <span>
                    {imageData.mimeType || 'Tipo de archivo no disponible'}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Función auxiliar para formatear tamaño de archivo
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
