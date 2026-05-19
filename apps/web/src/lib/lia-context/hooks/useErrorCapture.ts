'use client';

import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * useErrorCapture
 * 
 * Hook para capturar errores de consola y excepciones no manejadas.
 * Proporciona información útil para SofLIA cuando el usuario reporta bugs.
 * 
 * Características:
 * - Intercepta logger.error
 * - Captura errores no manejados (window.onerror)
 * - Captura rechazos de promesas no manejadas
 * - Mantiene un historial de los últimos N errores
 * - Proporciona métodos para limpiar y obtener errores
 */

import { useEffect, useRef, useCallback, useState } from 'react';

export interface CapturedError {
  id: string;
  type: 'console' | 'exception' | 'promise';
  message: string;
  stack?: string;
  timestamp: Date;
  url?: string;
  line?: number;
  column?: number;
  componentStack?: string;
}

interface UseErrorCaptureOptions {
  /** Máximo de errores a mantener en el historial */
  maxErrors?: number;
  /** Si debe capturar logger.error */
  captureConsole?: boolean;
  /** Si debe capturar excepciones no manejadas */
  captureExceptions?: boolean;
  /** Si debe capturar rechazos de promesas */
  capturePromises?: boolean;
  /** Callback cuando se captura un nuevo error */
  onError?: (error: CapturedError) => void;
}

const DEFAULT_OPTIONS: UseErrorCaptureOptions = {
  maxErrors: 20,
  captureConsole: true,
  captureExceptions: true,
  capturePromises: true,
};

/**
 * Hook para capturar errores del frontend
 */
export function useErrorCapture(options: UseErrorCaptureOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const [errors, setErrors] = useState<CapturedError[]>([]);
  const originalConsoleError = useRef<typeof techDebtLogger.error | null>(null);
  const isSetup = useRef(false);

  /**
   * Genera un ID único para cada error
   */
  const generateErrorId = useCallback(() => {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Agrega un error al historial
   */
  const addError = useCallback((error: CapturedError) => {
    setErrors(prev => {
      const newErrors = [error, ...prev];
      // Mantener solo los últimos N errores
      if (newErrors.length > (config.maxErrors || 20)) {
        return newErrors.slice(0, config.maxErrors);
      }
      return newErrors;
    });

    // Callback opcional
    if (config.onError) {
      config.onError(error);
    }
  }, [config]);

  /**
   * Limpia el historial de errores
   */
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  /**
   * Obtiene un resumen de los errores para LIA
   */
  const getErrorSummary = useCallback(() => {
    if (errors.length === 0) {
      return null;
    }

    const byType = {
      console: errors.filter(e => e.type === 'console').length,
      exception: errors.filter(e => e.type === 'exception').length,
      promise: errors.filter(e => e.type === 'promise').length,
    };

    return {
      total: errors.length,
      byType,
      recentErrors: errors.slice(0, 5).map(e => ({
        type: e.type,
        message: e.message.substring(0, 200),
        timestamp: e.timestamp,
      })),
    };
  }, [errors]);

  /**
   * Obtiene errores en formato para enviar a LIA
   */
  const getErrorsForLia = useCallback(() => {
    return errors.slice(0, 10).map(e => ({
      type: e.type,
      message: e.message,
      stack: e.stack?.split('\n').slice(0, 5).join('\n'),
      timestamp: e.timestamp,
    }));
  }, [errors]);

  /**
   * Configura la captura de errores
   */
  useEffect(() => {
    if (typeof window === 'undefined' || isSetup.current) return;
    isSetup.current = true;

    // 1. Interceptar logger.error
    if (config.captureConsole) {
      originalConsoleError.current = techDebtLogger.error;
      
      techDebtLogger.error = (...args: unknown[]) => {
        // Llamar al logger.error original
        if (args.length === 0) {
          originalConsoleError.current?.('');
        } else {
          const [message, ...rest] = args;
          originalConsoleError.current?.(message, ...rest);
        }

        // Capturar el error
        const message = args.map(arg => {
          if (arg instanceof Error) {
            return arg.message;
          }
          if (typeof arg === 'string') {
            return arg;
          }
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }).join(' ');

        // Obtener stack si es un Error
        let stack: string | undefined;
        for (const arg of args) {
          if (arg instanceof Error && arg.stack) {
            stack = arg.stack;
            break;
          }
        }

        const capturedError: CapturedError = {
          id: generateErrorId(),
          type: 'console',
          message,
          stack,
          timestamp: new Date(),
          url: window.location.href,
        };

        addError(capturedError);
      };
    }

    // 2. Capturar excepciones no manejadas
    if (config.captureExceptions) {
      const handleError = (event: ErrorEvent) => {
        const capturedError: CapturedError = {
          id: generateErrorId(),
          type: 'exception',
          message: event.message || 'Unknown error',
          stack: event.error?.stack,
          timestamp: new Date(),
          url: event.filename || window.location.href,
          line: event.lineno,
          column: event.colno,
        };

        addError(capturedError);
      };

      window.addEventListener('error', handleError);

      // Cleanup function para este listener
      return () => {
        window.removeEventListener('error', handleError);
      };
    }

    // 3. Capturar rechazos de promesas no manejadas
    if (config.capturePromises) {
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        let message = 'Unhandled Promise Rejection';
        let stack: string | undefined;

        if (event.reason instanceof Error) {
          message = event.reason.message;
          stack = event.reason.stack;
        } else if (typeof event.reason === 'string') {
          message = event.reason;
        } else {
          try {
            message = JSON.stringify(event.reason);
          } catch {
            message = String(event.reason);
          }
        }

        const capturedError: CapturedError = {
          id: generateErrorId(),
          type: 'promise',
          message,
          stack,
          timestamp: new Date(),
          url: window.location.href,
        };

        addError(capturedError);
      };

      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      // Cleanup function
      return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }

    // Cleanup: restaurar logger.error original
    return () => {
      if (originalConsoleError.current && config.captureConsole) {
        techDebtLogger.error = originalConsoleError.current;
      }
      isSetup.current = false;
    };
  }, [config.captureConsole, config.captureExceptions, config.capturePromises, generateErrorId, addError]);

  return {
    /** Lista de errores capturados */
    errors,
    /** Número de errores capturados */
    errorCount: errors.length,
    /** Si hay errores capturados */
    hasErrors: errors.length > 0,
    /** Limpia el historial de errores */
    clearErrors,
    /** Obtiene un resumen de errores */
    getErrorSummary,
    /** Obtiene errores en formato para SofLIA */
    getErrorsForLia,
    /** Agrega un error manualmente */
    addError,
  };
}

export default useErrorCapture;







