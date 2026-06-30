'use client';

import type { JSX } from 'react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

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
  // Guard against hydration mismatch: portal must only render on the client.
  // Server renders null; client renders null on first pass (matching server),
  // then switches to the portal after mount — avoiding React 18 reconciler crashes.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

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

  const toastContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed top-4 left-0 right-0 z-[99999] flex justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            className={`pointer-events-auto max-w-md w-[calc(100%-2rem)] sm:w-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-md ${styles.bg} ${styles.border} border rounded-lg shadow-lg p-4 flex items-center justify-center gap-3 text-center`}
          >
            {/* Icono */}
            <div className="flex-shrink-0">
              {styles.icon}
            </div>

            {/* Mensaje */}
            <div className="min-w-0">
              <p className={`text-sm font-medium ${styles.text}`}>
                {message}
              </p>
            </div>

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
        </div>
      )}
    </AnimatePresence>
  );

  if (!isMounted || !document.body) return null;

  return createPortal(toastContent, document.body) as unknown as JSX.Element;
}
