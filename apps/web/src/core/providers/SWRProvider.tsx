'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

/**
 * SWR Global Configuration Provider
 *
 * Estrategia de caché:
 * - revalidateOnFocus: false  — no refetch al cambiar de pestaña; en páginas con
 *   muchos hooks activos (analytics, jerarquía) esto evita 5-10 requests simultáneas
 *   cada vez que el usuario vuelve al tab. Los hooks que necesitan frescura usan
 *   refreshInterval propio (ej. notificaciones, jerarquía).
 * - dedupingInterval: 30 s   — componentes múltiples pidiendo la misma URL en la
 *   misma ventana de 30 s comparten una sola request.
 * - focusThrottleInterval: 5 min — fallback de seguridad para los hooks que
 *   sobreescriban revalidateOnFocus:true explícitamente.
 * - revalidateOnReconnect: true — recuperación de red sí justifica revalidar.
 *
 * @see https://swr.vercel.app/docs/options
 */

interface SWRProviderProps {
  children: ReactNode;
}

// Fetcher por defecto para todas las requests
const fetcher = async (url: string) => {
  const res = await fetch(url, {
    credentials: 'include', // Incluir cookies para autenticación
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  // Si la respuesta no es ok, lanzar error con info
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.') as Error & { info?: unknown; status?: number };
    try {
      error.info = await res.json();
    } catch {
      error.info = { error: res.statusText };
    }
    error.status = res.status;
    throw error;
  }
  
  return res.json();
};

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // Fetcher global - función que hace el request
        fetcher,
        
        // Revalidación automática
        revalidateOnFocus: false,       // No refetch al cambiar de pestaña (evita avalancha de requests en páginas con muchos hooks)
        revalidateOnReconnect: true,    // Revalida al recuperar conexión de red
        revalidateIfStale: true,        // Revalida si data está stale al montar

        // Retry en caso de error
        shouldRetryOnError: true,       // Reintentar si falla
        errorRetryCount: 3,             // Máximo 3 reintentos
        errorRetryInterval: 5000,       // 5 segundos entre reintentos

        // Deduplicación y throttling
        dedupingInterval: 30000,        // Deduplica requests idénticas en 30 s (antes: 5 s)
        focusThrottleInterval: 300000,  // Throttle de fallback para hooks con revalidateOnFocus:true explícito (5 min)
        
        // Timeouts
        loadingTimeout: 3000,           // Mostrar loading después de 3s
        
        // Cache strategy
        refreshInterval: 0,             // No auto-refresh (usar revalidateOnFocus)
        refreshWhenHidden: false,       // No refrescar en background
        refreshWhenOffline: false,      // No refrescar sin conexión
        
        // Suspense (opcional, para usar con React Suspense)
        suspense: false,
        
        // Callbacks globales (útil para debugging)
        onSuccess: (data, key) => {
          // Solo en desarrollo
          if (process.env.NODE_ENV === 'development') {
          }
        },
        
        onError: (error, key) => {
          // Log de errores
          
          // Aquí podrías enviar a servicio de monitoring (Sentry, etc.)
          // if (process.env.NODE_ENV === 'production') {
          //   reportErrorToService(error, key);
          // }
        },
        
        onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
          // No reintentar en errores 404
          if (error.status === 404) return;
          
          // No reintentar más de 3 veces
          if (retryCount >= 3) return;
          
          // Reintentar después de 5 segundos
          setTimeout(() => revalidate({ retryCount }), 5000);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}

/**
 * Hook personalizado para configuraciones específicas
 * 
 * Ejemplos de uso:
 * 
 * // Datos que cambian frecuentemente (cada 30 segundos)
 * const { data } = useSWR('/api/stats', { refreshInterval: 30000 })
 * 
 * // Datos inmutables (no revalidar)
 * const { data } = useSWR('/api/config', { revalidateOnFocus: false, revalidateOnReconnect: false })
 * 
 * // Con mutación optimista
 * const { data, mutate } = useSWR('/api/posts')
 * await mutate(optimisticData, { revalidate: false })
 */
