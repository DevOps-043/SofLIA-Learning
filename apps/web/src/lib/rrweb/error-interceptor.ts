/**
 * Error Interceptor para rrweb
 * Captura errores de consola y network para incluirlos en las grabaciones
 */

'use client';

export interface ErrorEvent {
  type: 'console_error' | 'console_warn' | 'js_error' | 'network_error' | 'unhandled_rejection';
  timestamp: number;
  message: string;
  details?: Record<string, unknown>;
}

// Buffer de errores recientes (últimos 50)
const MAX_ERROR_BUFFER = 50;
let errorBuffer: ErrorEvent[] = [];
let isInterceptorActive = false;

// Referencias a las funciones originales
let originalConsoleError: typeof console.error | null = null;
let originalConsoleWarn: typeof console.warn | null = null;
let originalFetch: typeof fetch | null = null;

/**
 * Agrega un error al buffer circular
 */
function addError(error: ErrorEvent) {
  errorBuffer.push(error);
  if (errorBuffer.length > MAX_ERROR_BUFFER) {
    errorBuffer = errorBuffer.slice(-MAX_ERROR_BUFFER);
  }
}

/**
 * Obtiene los errores recientes
 */
export function getRecentErrors(): ErrorEvent[] {
  return [...errorBuffer];
}

/**
 * Limpia el buffer de errores
 */
export function clearErrorBuffer() {
  errorBuffer = [];
}

/**
 * Serializa argumentos de consola de forma segura
 */
function safeSerialize(args: unknown[]): string[] {
  return args.map(arg => {
    try {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}${arg.stack ? `\n${arg.stack}` : ''}`;
      }
      if (typeof arg === 'object') {
        return JSON.stringify(arg, null, 2).substring(0, 500);
      }
      return String(arg);
    } catch {
      return '[No serializable]';
    }
  });
}

/**
 * Inicia la interceptación de errores
 */
export function startErrorInterceptor() {
  if (typeof window === 'undefined' || isInterceptorActive) return;
  
  isInterceptorActive = true;

  // 1. Interceptar console.error
  originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    addError({
      type: 'console_error',
      timestamp: Date.now(),
      message: safeSerialize(args).join(' '),
      details: { args: safeSerialize(args) }
    });
    originalConsoleError?.apply(console, args);
  };

  // 2. Interceptar console.warn
  originalConsoleWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    addError({
      type: 'console_warn',
      timestamp: Date.now(),
      message: safeSerialize(args).join(' '),
      details: { args: safeSerialize(args) }
    });
    originalConsoleWarn?.apply(console, args);
  };

  // 3. Interceptar errores JavaScript globales
  window.addEventListener('error', (event: globalThis.ErrorEvent) => {
    addError({
      type: 'js_error',
      timestamp: Date.now(),
      message: event.message || 'Unknown error',
      details: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      }
    });
  });

  // 4. Interceptar promesas rechazadas sin manejar
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    addError({
      type: 'unhandled_rejection',
      timestamp: Date.now(),
      message: reason instanceof Error ? reason.message : String(reason),
      details: {
        stack: reason instanceof Error ? reason.stack : undefined
      }
    });
  });

  // 5. Interceptar errores de fetch
  originalFetch = window.fetch;
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const [input, init] = args;
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    
    try {
      const response = await originalFetch!(...args);
      
      // Registrar errores HTTP (4xx y 5xx)
      if (!response.ok) {
        addError({
          type: 'network_error',
          timestamp: Date.now(),
          message: `HTTP ${response.status}: ${response.statusText}`,
          details: {
            url: url,
            method: init?.method || 'GET',
            status: response.status,
            statusText: response.statusText
          }
        });
      }
      
      return response;
    } catch (error) {
      // Registrar errores de red (sin conexión, CORS, etc.)
      addError({
        type: 'network_error',
        timestamp: Date.now(),
        message: error instanceof Error ? error.message : 'Network request failed',
        details: {
          url: url,
          method: init?.method || 'GET',
          error: error instanceof Error ? error.message : String(error)
        }
      });
      throw error;
    }
  };

}

/**
 * Detiene la interceptación y restaura funciones originales
 */
export function stopErrorInterceptor() {
  if (!isInterceptorActive) return;
  
  if (originalConsoleError) {
    console.error = originalConsoleError;
    originalConsoleError = null;
  }
  
  if (originalConsoleWarn) {
    console.warn = originalConsoleWarn;
    originalConsoleWarn = null;
  }
  
  if (originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
  }
  
  isInterceptorActive = false;
}

/**
 * Obtiene un resumen de errores para incluir en reportes
 */
export function getErrorSummary(): {
  totalErrors: number;
  byType: Record<string, number>;
  recentErrors: ErrorEvent[];
} {
  const byType: Record<string, number> = {};
  
  for (const error of errorBuffer) {
    byType[error.type] = (byType[error.type] || 0) + 1;
  }
  
  return {
    totalErrors: errorBuffer.length,
    byType,
    recentErrors: errorBuffer.slice(-10) // Últimos 10 errores
  };
}
