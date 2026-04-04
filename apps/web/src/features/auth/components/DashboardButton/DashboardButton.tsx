'use client';

import { useState } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { redirectToDashboard } from '../../actions/dashboard-redirect';

function getRedirectDigest(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('digest' in error)) {
    return null;
  }

  return typeof error.digest === 'string' ? error.digest : null;
}

export function DashboardButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleDashboardClick = async () => {
    try {
      setIsLoading(true);
      await redirectToDashboard();
    } catch (error) {
      // Verificar si es una redirección de Next.js (no es un error real)
      if (error && typeof error === 'object' && 'digest' in error) {
        const digest = getRedirectDigest(error);
        if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
          // Es una redirección exitosa, dejar que Next.js la maneje
          return;
        }
      }

      // Solo es un error real si llegamos aquí
      console.error('Error redirigiendo al dashboard:', error);
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleDashboardClick}
      disabled={isLoading}
      className="
        w-12 h-12 sm:w-14 sm:h-14
        rounded-full
        bg-white dark:bg-gray-800
        border border-gray-300 dark:border-gray-600
        hover:bg-gray-50 dark:hover:bg-gray-700
        hover:border-gray-400 dark:hover:border-gray-500
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        flex items-center justify-center
        shadow-sm hover:shadow-md
      "
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title="Ir al Dashboard"
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-gray-600 dark:text-gray-300" />
      ) : (
        <ExternalLink className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      )}
    </motion.button>
  );
}
