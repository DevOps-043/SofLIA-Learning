'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export function DashboardButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleDashboardClick = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/dashboard-destination');
      const data = await response.json();
      router.push(data.destination || '/dashboard');
    } catch (error) {
      console.error('Error redirigiendo al dashboard:', error);
      router.push('/dashboard');
    } finally {
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
