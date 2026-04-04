'use client';

/**
 * useApiTracking
 * 
 * Hook para rastrear llamadas a API y proporcionar contexto a SofLIA.
 * Intercepta fetch y opcionalmente XMLHttpRequest para capturar:
 * - URLs de endpoints
 * - Métodos HTTP
 * - Códigos de respuesta
 * - Tiempos de respuesta
 * - Errores de red
 */

import { useEffect, useState, useCallback, useRef } from 'react';

export interface ApiCall {
  id: string;
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  duration?: number;
  timestamp: Date;
  isError: boolean;
  errorMessage?: string;
}

interface UseApiTrackingOptions {
  /** Máximo de llamadas a mantener en el historial */
  maxCalls?: number;
  /** Filtrar URLs que coincidan con estos patrones */
  includePatterns?: RegExp[];
  /** Excluir URLs que coincidan con estos patrones */
  excludePatterns?: RegExp[];
  /** Si debe interceptar fetch */
  interceptFetch?: boolean;
  /** Callback cuando se completa una llamada */
  onApiCall?: (call: ApiCall) => void;
}

const DEFAULT_OPTIONS: UseApiTrackingOptions = {
  maxCalls: 50,
  includePatterns: [/\/api\//], // Solo rastrear llamadas a /api/
  excludePatterns: [
    /\/api\/lia\/chat/, // No rastrear llamadas al chat de SofLIA (evitar recursión)
    /\/_next\//, // No rastrear recursos de Next.js
    /\/favicon/, // No rastrear favicon
  ],
  interceptFetch: true,
};

/**
 * Hook para rastrear llamadas a API
 */
export function useApiTracking(options: UseApiTrackingOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);
  const originalFetch = useRef<typeof fetch | null>(null);
  const isSetup = useRef(false);

  /**
   * Genera un ID único para cada llamada
   */
  const generateCallId = useCallback(() => {
    return `api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Verifica si una URL debe ser rastreada
   */
  const shouldTrackUrl = useCallback((url: string): boolean => {
    // Verificar exclusiones primero
    if (config.excludePatterns?.some(pattern => pattern.test(url))) {
      return false;
    }
    // Si hay patrones de inclusión, la URL debe coincidir con al menos uno
    if (config.includePatterns && config.includePatterns.length > 0) {
      return config.includePatterns.some(pattern => pattern.test(url));
    }
    // Por defecto, rastrear todas
    return true;
  }, [config.excludePatterns, config.includePatterns]);

  /**
   * Agrega una llamada al historial
   */
  const addApiCall = useCallback((call: ApiCall) => {
    setApiCalls(prev => {
      const newCalls = [call, ...prev];
      // Mantener solo las últimas N llamadas
      if (newCalls.length > (config.maxCalls || 50)) {
        return newCalls.slice(0, config.maxCalls);
      }
      return newCalls;
    });

    // Callback opcional
    if (config.onApiCall) {
      config.onApiCall(call);
    }
  }, [config]);

  /**
   * Limpia el historial de llamadas
   */
  const clearCalls = useCallback(() => {
    setApiCalls([]);
  }, []);

  /**
   * Obtiene llamadas con error
   */
  const getErrorCalls = useCallback(() => {
    return apiCalls.filter(call => call.isError || (call.status && call.status >= 400));
  }, [apiCalls]);

  /**
   * Obtiene llamadas recientes (últimos N segundos)
   */
  const getRecentCalls = useCallback((seconds: number = 60) => {
    const cutoff = new Date(Date.now() - seconds * 1000);
    return apiCalls.filter(call => call.timestamp > cutoff);
  }, [apiCalls]);

  /**
   * Obtiene resumen de llamadas para SofLIA
   */
  const getApiSummary = useCallback(() => {
    const errors = getErrorCalls();
    const recent = getRecentCalls(120); // Últimos 2 minutos

    // Agrupar por endpoint
    const byEndpoint: Record<string, number> = {};
    recent.forEach(call => {
      const endpoint = new URL(call.url, window.location.origin).pathname;
      byEndpoint[endpoint] = (byEndpoint[endpoint] || 0) + 1;
    });

    return {
      totalCalls: apiCalls.length,
      recentCalls: recent.length,
      errorCount: errors.length,
      byEndpoint,
      recentErrors: errors.slice(0, 5).map(e => ({
        url: e.url,
        status: e.status,
        errorMessage: e.errorMessage,
      })),
    };
  }, [apiCalls, getErrorCalls, getRecentCalls]);

  /**
   * Obtiene llamadas en formato para SofLIA
   */
  const getCallsForLia = useCallback(() => {
    return apiCalls.slice(0, 10).map(call => ({
      endpoint: new URL(call.url, window.location.origin).pathname,
      method: call.method,
      status: call.status,
      isError: call.isError,
      duration: call.duration,
      timestamp: call.timestamp.toISOString(),
    }));
  }, [apiCalls]);

  const getCallsForSofLIA = getCallsForLia;

  /**
   * Configura la intercepción de fetch
   */
  useEffect(() => {
    if (typeof window === 'undefined' || !config.interceptFetch || isSetup.current) return;
    isSetup.current = true;

    // Guardar fetch original
    originalFetch.current = window.fetch;

    // Reemplazar fetch con nuestra versión instrumentada
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' 
        ? input 
        : input instanceof URL 
          ? input.toString() 
          : input.url;
      
      const method = init?.method || 'GET';

      // Si no debemos rastrear esta URL, usar fetch original
      if (!shouldTrackUrl(url)) {
        return originalFetch.current!(input, init);
      }

      const callId = generateCallId();
      const startTime = Date.now();

      try {
        const response = await originalFetch.current!(input, init);
        const duration = Date.now() - startTime;

        const apiCall: ApiCall = {
          id: callId,
          url,
          method: method.toUpperCase(),
          status: response.status,
          statusText: response.statusText,
          duration,
          timestamp: new Date(),
          isError: !response.ok,
          errorMessage: !response.ok ? `${response.status} ${response.statusText}` : undefined,
        };

        addApiCall(apiCall);

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;

        const apiCall: ApiCall = {
          id: callId,
          url,
          method: method.toUpperCase(),
          duration,
          timestamp: new Date(),
          isError: true,
          errorMessage: error instanceof Error ? error.message : 'Network error',
        };

        addApiCall(apiCall);

        // Re-lanzar el error para que el código que hizo el fetch lo maneje
        throw error;
      }
    };

    // Cleanup: restaurar fetch original
    return () => {
      if (originalFetch.current) {
        window.fetch = originalFetch.current;
      }
      isSetup.current = false;
    };
  }, [config.interceptFetch, shouldTrackUrl, generateCallId, addApiCall]);

  return {
    /** Lista de llamadas a API */
    apiCalls,
    /** Número total de llamadas */
    callCount: apiCalls.length,
    /** Si hay llamadas registradas */
    hasCalls: apiCalls.length > 0,
    /** Limpia el historial */
    clearCalls,
    /** Obtiene llamadas con error */
    getErrorCalls,
    /** Obtiene llamadas recientes */
    getRecentCalls,
    /** Obtiene resumen para SofLIA */
    getApiSummary,
    /** Obtiene llamadas en formato para SofLIA */
    getCallsForLia,
    /** Alias retrocompatible */
    getCallsForSofLIA,
    /** Agrega una llamada manualmente */
    addApiCall,
  };
}

export default useApiTracking;








