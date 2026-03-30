import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UseSessionRefreshOptions {
  /**
   * Minutos antes de la expiración para refrescar automáticamente
   * Por defecto: 5 minutos
   */
  refreshBeforeExpiry?: number;
  
  /**
   * Si se debe redirigir a /auth cuando la sesión expire
   * Por defecto: true
   */
  redirectOnExpiry?: boolean;
  
  /**
   * Callback cuando el token se refresca exitosamente
   */
  onRefresh?: () => void;
  
  /**
   * Callback cuando la sesión expira
   */
  onExpiry?: () => void;
}

/**
 * Hook para manejar el refresh automático de tokens
 * 
 * Este hook:
 * - Refresca el access token automáticamente antes de que expire
 * - Redirige a login si la sesión expira completamente
 * - Proporciona funciones para refrescar manualmente
 * 
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { refreshNow, isRefreshing } = useSessionRefresh({
 *     refreshBeforeExpiry: 5, // Refrescar 5 minutos antes
 *     onExpiry: () => toast.error('Sesión expirada')
 *   });
 *   
 *   return (
 *     <div>
 *       <button onClick={refreshNow} disabled={isRefreshing}>
 *         Refrescar sesión
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSessionRefresh(options: UseSessionRefreshOptions = {}) {
  const {
    refreshBeforeExpiry = 5, // 5 minutos por defecto
    redirectOnExpiry = true,
    onRefresh,
    onExpiry
  } = options;
  
  const router = useRouter();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);
  
  /**
   * Refresca el access token llamando al API
   */
  const refreshToken = useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }
    
    try {
      isRefreshingRef.current = true;
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const data = await response.json();
        
        if (data.code === 'SESSION_EXPIRED') {
          onExpiry?.();
          
          if (redirectOnExpiry) {
            router.push('/auth?error=session_expired');
          }
          return;
        }
        
        throw new Error(data.error || 'Error al refrescar token');
      }
      
      const data = await response.json();
      // Programar el siguiente refresh
      if (data.expiresAt) {
        scheduleNextRefresh(data.expiresAt);
      }
      
      onRefresh?.();
      
    } catch (error) {
      
      // Si falla, intentar una vez más en 30 segundos
      refreshTimerRef.current = setTimeout(() => {
        refreshToken();
      }, 30000);
      
    } finally {
      isRefreshingRef.current = false;
    }
  }, [onRefresh, onExpiry, redirectOnExpiry, router]);
  
  /**
   * Programa el siguiente refresh automático
   */
  const scheduleNextRefresh = useCallback((expiresAt: string) => {
    // Limpiar timer anterior si existe
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    
    const expiryTime = new Date(expiresAt).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;
    const refreshTime = timeUntilExpiry - (refreshBeforeExpiry * 60 * 1000);
    
    if (refreshTime <= 0) {
      // Ya expiró o está a punto de expirar, refrescar inmediatamente
      refreshToken();
    } else {
      refreshTimerRef.current = setTimeout(() => {
        refreshToken();
      }, refreshTime);
    }
  }, [refreshBeforeExpiry, refreshToken]);
  
  /**
   * Obtiene el estado actual de la sesión y programa el primer refresh
   */
  const initializeSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        return;
      }
      
      const data = await response.json();
      
      if (data.authenticated && data.accessExpiresAt) {
        scheduleNextRefresh(data.accessExpiresAt);
      }
      
    } catch (error) {
    }
  }, [scheduleNextRefresh]);
  
  /**
   * Inicializar al montar el componente
   */
  useEffect(() => {
    initializeSession();
    
    // Limpiar timer al desmontar
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [initializeSession]);
  
  /**
   * Función para refrescar manualmente
   */
  const refreshNow = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    refreshToken();
  }, [refreshToken]);
  
  return {
    refreshNow,
    isRefreshing: isRefreshingRef.current
  };
}

