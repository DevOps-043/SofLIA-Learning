'use client';

import type { JSX } from 'react';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, CheckCircle2 } from 'lucide-react';

export type ToastType = 'error' | 'success' | 'info';

interface ToastNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  type?: ToastType;
  duration?: number; // Duración en milisegundos antes de cerrar automáticamente
}

export function ToastNotification({
  isOpen,
  onClose,
  message,
  type = 'error',
  duration = 5000,
}: ToastNotificationProps): JSX.Element | null {
  // Cerrar automáticamente después de la duración especificada
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-700 dark:text-green-300',
          icon: <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />,
        };
      case 'info':
        return {
          bg: 'bg-accent/10 dark:bg-accent/20', /* Aqua */
          border: 'border-accent/30 dark:border-accent/30',
          text: 'text-accent dark:text-accent',
          icon: <AlertCircle className="w-5 h-5 text-accent dark:text-accent" />, /* Aqua */
        };
      default: // error
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-700 dark:text-red-300',
          icon: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
        };
    }
  };

  const styles = getStyles();

  // Usar portal para renderizar fuera de la jerarquía del DOM
  const toastContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.9 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          className={`fixed top-4 right-4 z-[99999] max-w-md w-full sm:w-auto pointer-events-auto ${styles.bg} ${styles.border} border rounded-lg shadow-lg p-4 flex items-start gap-3`}
        >
          {/* Icono */}
          <div className="flex-shrink-0 mt-0.5">
            {styles.icon}
          </div>

          {/* Mensaje */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${styles.text}`}>
              {message}
            </p>
          </div>

          {/* Botón de cerrar */}
          <button
            onClick={onClose}
            className={`flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${styles.text}`}
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Barra de progreso para el cierre automático */}
          {duration > 0 && (
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
              className={`absolute bottom-0 left-0 right-0 h-1 ${type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-accent'} rounded-b-lg`} /* Aqua para info */
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Renderizar en el body usando portal si estamos en el cliente
  if (typeof window !== 'undefined') {
    return createPortal(toastContent, document.body) as unknown as JSX.Element;
  }

  return null;
}
