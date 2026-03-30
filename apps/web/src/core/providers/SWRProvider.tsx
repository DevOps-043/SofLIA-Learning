'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

/**
 * SWR Global Configuration Provider
 * 
 * Configuración optimizada para cache inteligente y revalidación automática.
 * 
 * Estrategia de cache:
 * - dedupingInterval: 2s - Evita requests duplicados en 2 segundos
 * - focusThrottleInterval: 5s - Revalida máximo cada 5s al enfocar ventana
 * - revalidateOnFocus: true - Revalida datos cuando usuario vuelve a la app
 * - revalidateOnReconnect: true - Revalida cuando se recupera conexión
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
    const error: any = new Error('An error occurred while fetching the data.');
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
        revalidateOnFocus: true,        // Revalida al volver a la pestaña
        revalidateOnReconnect: true,    // Revalida al recuperar conexión
        revalidateIfStale: true,        // Revalida si data está stale
        
        // Retry en caso de error
        shouldRetryOnError: true,       // Reintentar si falla
        errorRetryCount: 3,             // Máximo 3 reintentos
        errorRetryInterval: 5000,       // 5 segundos entre reintentos
        
        // Deduplicación y throttling
        dedupingInterval: 2000,         // Deduplica requests en 2 segundos
        focusThrottleInterval: 5000,    // Throttle revalidación al enfocar (5s)
        
        // Timeouts
        loadingTimeout: 3000,           // Mostrar loading después de 3s
        
        // Cache strategy
        refreshInterval: 0,             // No auto-refresh (usar revalidateOnFocus)
        refreshWhenHidden: false,       // No refrescar en background
        refreshWhenOffline: false,      // No refrescar sin conexión
        
        // Suspense (opcional, para usar con React Suspense)
        suspense: false,
        
        // Comparación de datos
        compare: (a, b) => {
          // Comparación personalizada para evitar re-renders innecesarios
          return JSON.stringify(a) === JSON.stringify(b);
        },
        
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
