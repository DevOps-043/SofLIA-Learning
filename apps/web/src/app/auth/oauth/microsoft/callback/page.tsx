'use client';

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { handleMicrosoftCallback } from '@/features/auth/actions/oauth';

export default function MicrosoftCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const result = await handleMicrosoftCallback({
          code: params.get('code') || '',
          state: params.get('state') || '',
          error: params.get('error') || '',
          error_description: params.get('error_description') || '',
        });
        if (result && 'error' in result && result.error) {
          // Redirigir al login general (/auth) para evitar interpretar "login" como slug de organización
          router.replace(`/auth?error=${encodeURIComponent(result.error as string)}`);
        }
      } catch (err) {
        // Si la Server Action lanzó (redirección u otro error de red), evitar romper el cliente
        techDebtLogger.error('[MICROSOFT OAUTH] Callback error:', err);
        router.replace('/auth?error=oauth_callback_failed');
      }
    })();
  }, [params, router]);

  return null;
}


