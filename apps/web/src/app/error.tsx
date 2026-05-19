'use client';

import { logger as techDebtLogger } from '@/lib/utils/logger'
import * as React from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    techDebtLogger.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white dark:bg-carbon-900 flex items-center justify-center p-6" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-gray-500/20 dark:text-gray-500/30">
            500
          </h1>
          <h2 className="text-3xl font-bold text-primary dark:text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
            Error del servidor
          </h2>
          <p className="text-gray-500 dark:text-white/80" style={{ fontFamily: 'Inter, sans-serif' }}>
            Lo sentimos, ocurrió un error inesperado. Por favor, intenta de nuevo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary text-white rounded-xl font-semibold transition-all shadow-sm"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-primary dark:border-primary text-primary dark:text-white bg-transparent rounded-xl font-semibold hover:bg-primary hover:text-white dark:hover:bg-primary transition-all"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
