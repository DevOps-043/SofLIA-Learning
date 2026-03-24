/**
 * Utilidad de logging profesional sin emojis
 * Compatible con herramientas de monitoreo y parsing en producción
 * 
 * Niveles de log:
 * - DEBUG: Información detallada para debugging (solo en desarrollo)
 * - INFO: Información general del flujo de la aplicación
 * - WARN: Advertencias que no detienen la ejecución
 * - ERROR: Errores que requieren atención
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Formatea el mensaje de log con timestamp y nivel
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  /**
   * Sanitiza información sensible antes de loguear
   */
  private sanitize(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...data } as Record<string, unknown>;
    const sensitiveKeys = [
      'password',
      'token',
      'accessToken',
      'access_token',
      'refreshToken',
      'refresh_token',
      'secret',
      'apiKey',
      'api_key',
      'authorization',
      'cookie',
      'session',
    ];

    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Log nivel DEBUG - solo en desarrollo
   */
  debug(message: string, context?: LogContext): void {
    if (!this.isDevelopment) return;
    
    const sanitizedContext = context ? this.sanitize(context) : undefined;
    // console.log(this.formatMessage('DEBUG', message, sanitizedContext as LogContext));
  }

  /**
   * Log nivel INFO - información general
   */
  info(message: string, context?: LogContext): void {
    const sanitizedContext = context ? this.sanitize(context) : undefined;
    console.log(this.formatMessage('INFO', message, sanitizedContext as LogContext));
  }

  /**
   * Log nivel WARN - advertencias
   */
  warn(message: string, context?: LogContext): void {
    const sanitizedContext = context ? this.sanitize(context) : undefined;
    // console.warn(this.formatMessage('WARN', message, sanitizedContext as LogContext));
  }

  /**
   * Log nivel ERROR - errores
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        name: error.name,
      } : error,
    };

    const sanitizedContext = this.sanitize(errorContext) as LogContext;
    console.error(this.formatMessage('ERROR', message, sanitizedContext));
  }

  /**
   * Log de autenticación - información sensible sanitizada automáticamente
   */
  auth(action: string, details?: LogContext): void {
    const sanitizedDetails = details ? this.sanitize(details) : undefined;
    this.info(`Auth: ${action}`, sanitizedDetails as LogContext);
  }

  /**
   * Log de API - requests y responses
   */
  api(method: string, path: string, statusCode?: number, context?: LogContext): void {
    const sanitizedContext = context ? this.sanitize(context) : undefined;
    this.info(`API ${method} ${path}${statusCode ? ` - ${statusCode}` : ''}`, sanitizedContext as LogContext);
  }

  /**
   * Log de base de datos
   */
  db(operation: string, table: string, context?: LogContext): void {
    const sanitizedContext = context ? this.sanitize(context) : undefined;
    this.info(`DB ${operation} on ${table}`, sanitizedContext as LogContext);
  }
}

// Exportar instancia singleton
export const logger = new Logger();

// Exportar clase para testing
export { Logger };
