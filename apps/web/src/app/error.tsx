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
    <div className="min-h-screen bg-white dark:bg-[#0F1419] flex items-center justify-center p-6" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-[#6C757D]/20 dark:text-[#6C757D]/30">
            500
          </h1>
          <h2 className="text-3xl font-bold text-[#0A2540] dark:text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
            Error del servidor
          </h2>
          <p className="text-[#6C757D] dark:text-white/80" style={{ fontFamily: 'Inter, sans-serif' }}>
            Lo sentimos, ocurrió un error inesperado. Por favor, intenta de nuevo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0A2540] hover:bg-[#0d2f4d] text-white rounded-xl font-semibold transition-all shadow-sm"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#0A2540] dark:border-[#0A2540] text-[#0A2540] dark:text-white bg-transparent rounded-xl font-semibold hover:bg-[#0A2540] hover:text-white dark:hover:bg-[#0A2540] transition-all"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
