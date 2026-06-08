'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Twitter, Facebook, Mail, Share2, Check } from 'lucide-react';

export interface ShareData {
  url: string;
  title?: string;
  text?: string;
  description?: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareData: ShareData | null;
}

export function ShareModal({ isOpen, onClose, shareData }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  // Resetear estado cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  if (!shareData) return null;

  const { url, title, text, description } = shareData;
  const shareText = text || description || title || 'Mira esto';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareByEmail = () => {
    const subject = title || 'Compartir contenido';
    const body = `${shareText}\n\nVer más: ${url}`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = emailUrl;
  };

  const shareOptions = [
    {
      name: 'Copiar enlace',
      icon: Copy,
      action: copyToClipboard,
      color: 'text-accent',
      bgColor: 'bg-accent/10 dark:bg-accent/20',
    },
    {
      name: 'Compartir en Twitter',
      icon: Twitter,
      action: shareToTwitter,
      color: 'text-primary dark:text-accent',
      bgColor: 'bg-primary/10 dark:bg-accent/20',
    },
    {
      name: 'Compartir en Facebook',
      icon: Facebook,
      action: shareToFacebook,
      color: 'text-primary dark:text-accent',
      bgColor: 'bg-primary/10 dark:bg-accent/20',
    },
    {
      name: 'Compartir por email',
      icon: Mail,
      action: shareByEmail,
      color: 'text-success',
      bgColor: 'bg-success/10 dark:bg-success/20',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay con backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-carbon-900/80 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              className="bg-white dark:bg-carbon-800 rounded-xl shadow-2xl max-w-md w-full pointer-events-auto relative max-h-[90vh] overflow-y-auto overflow-x-hidden border border-gray-200 dark:border-gray-500/30"
            >
              {/* Contenido */}
              <div className="relative p-5 sm:p-8">
                {/* Botón de cerrar */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 text-gray-500 dark:text-white/60 hover:text-primary dark:hover:text-white transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-primary/30"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Icono y título */}
                <div className="flex flex-col items-center mb-4 sm:mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                      delay: 0.1,
                    }}
                    className="w-14 h-14 sm:w-16 sm:h-16 bg-primary dark:bg-primary rounded-full flex items-center justify-center shadow-lg mb-3 sm:mb-4"
                  >
                    <Share2 className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl sm:text-2xl font-bold text-center text-primary dark:text-white mb-2"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
                  >
                    Compartir
                  </motion.h3>

                  {title && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-center text-gray-500 dark:text-white/80 text-sm"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                    >
                      {title}
                    </motion.p>
                  )}
                </div>

                {/* Opciones de compartir */}
                <div className="space-y-2 mb-4">
                  {shareOptions.map((option, index) => (
                    <motion.button
                      key={option.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.05, duration: 0.2 }}
                      onClick={() => {
                        option.action();
                        if (option.name === 'Copiar enlace') {
                          // No cerrar inmediatamente para mostrar el feedback
                        } else {
                          // Cerrar después de un pequeño delay para otras acciones
                          setTimeout(() => onClose(), 300);
                        }
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-200/50 dark:hover:bg-primary/30 transition-colors text-left group border border-gray-200 dark:border-gray-500/30"
                    >
                      <div className={`p-2 rounded-xl ${option.bgColor} group-hover:scale-110 transition-transform`}>
                        <option.icon className={`w-5 h-5 ${option.color}`} />
                      </div>
                      <span 
                        className="text-primary dark:text-white font-medium flex-1"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                      >
                        {option.name}
                      </span>
                      {option.name === 'Copiar enlace' && copied && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-success"
                        >
                          <Check className="w-5 h-5" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* URL preview */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 p-3 bg-gray-200/30 dark:bg-primary/20 rounded-xl border border-gray-200 dark:border-gray-500/30"
                >
                  <p 
                    className="text-xs text-gray-500 dark:text-white/60 mb-1.5"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                  >
                    Enlace:
                  </p>
                  <p 
                    className="text-sm text-primary dark:text-white break-all font-mono"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                  >
                    {url}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

