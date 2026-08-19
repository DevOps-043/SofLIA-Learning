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
        if (result && 'webHandoffUrl' in result && result.webHandoffUrl) {
          window.location.replace(result.webHandoffUrl as string);
          return;
        }
        if (result && 'error' in result && result.error) {
          // Redirigir al login general (/auth) para evitar interpretar "login" como slug de organización
          router.replace(`/auth?error=${encodeURIComponent(result.error as string)}`);
          return;
        }
        // El flujo venía de Pulse Hub: se devuelve el resultado al escritorio
        // en lugar de continuar hacia el panel web.
        if (result && 'desktopHandoffUrl' in result && result.desktopHandoffUrl) {
          window.location.href = result.desktopHandoffUrl as string;
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

