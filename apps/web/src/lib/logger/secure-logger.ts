/**
 * Logger Estructurado y Seguro
 *
 * Sistema de logging que previene exposición de datos sensibles
 * Compatible con Winston para logs estructurados en producción
 *
 * @see https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure
 */

/**
 * Niveles de logging disponibles
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug',
}

/**
 * Campos sensibles que deben ser sanitizados antes de loggear
 */
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'password_hash',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'apiKey',
  'api_key',
  'secret',
  'privateKey',
  'private_key',
  'jwt',
  'token',
  'authorization',
  'cookie',
  'sessionId',
  'session_id',
  'ssn',
  'creditCard',
  'credit_card',
  'cvv',
  'pin',
] as const;

/**
 * Patterns sensibles en strings que deben ser redactados
 */
const SENSITIVE_PATTERNS = [
  /Bearer\s+[\w\-._~+/]+=*/gi, // Bearer tokens
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Emails (opcional)
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN format
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card numbers
];

/**
 * Placeholder para datos redactados
 */
const REDACTED = '[REDACTED]';

/**
 * Interfaz para metadatos de log
 */
interface LogMetadata {
  [key: string]: unknown;
  timestamp?: string;
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Opciones para el logger
 */
interface LoggerOptions {
  context?: string;
  sanitize?: boolean;
  includeStackTrace?: boolean;
}

/**
 * Sanitiza un objeto removiendo o redactando campos sensibles
 *
 * @param data - Objeto a sanitizar
 * @param deep - Si debe sanitizar recursivamente (default: true)
 * @returns Objeto sanitizado
 */
export function sanitizeData<T>(
  data: T,
  deep: boolean = true
): T {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, deep)) as T;
  }

  const sanitized: Record<string, unknown> = {};
  const record = data as Record<string, unknown>;

  for (const key in record) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) {
      continue;
    }

    const lowerKey = key.toLowerCase();
    const value = record[key];

    // Redactar campos sensibles
    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
      sanitized[key] = REDACTED;
      continue;
    }

    // Sanitizar recursivamente si es un objeto
    if (deep && value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeData(value, deep);
    } else if (typeof value === 'string') {
      // Redactar patterns sensibles en strings
      sanitized[key] = redactSensitivePatterns(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Redacta patterns sensibles en un string
 *
 * @param text - Texto a redactar
 * @returns Texto redactado
 */
export function redactSensitivePatterns(text: string): string {
  if (typeof text !== 'string') {
    return text;
  }

  let redacted = text;

  for (const pattern of SENSITIVE_PATTERNS) {
    redacted = redacted.replace(pattern, REDACTED);
  }

  return redacted;
}

/**
 * Sanitiza un stack trace removiendo paths absolutos y datos sensibles
 *
 * @param stack - Stack trace a sanitizar
 * @returns Stack trace sanitizado
 */
export function sanitizeStackTrace(stack?: string): string | undefined {
  if (!stack) {
    return undefined;
  }

  // Remover paths absolutos del sistema de archivos
  let sanitized = stack.replace(/\/[\w\-./]+\//g, '[PATH]/');
  sanitized = sanitized.replace(/[A-Z]:\\[\w\-\\/.]+\\/g, '[PATH]\\');

  // Limitar a las primeras 5 líneas del stack trace
  const lines = sanitized.split('\n').slice(0, 5);

  return lines.join('\n');
}

/**
 * Clase Logger Seguro
 */
class SecureLogger {
  private context: string;
  private defaultOptions: LoggerOptions;

  constructor(context: string = 'App', options: LoggerOptions = {}) {
    this.context = context;
    this.defaultOptions = {
      sanitize: true,
      includeStackTrace: process.env.NODE_ENV !== 'production',
      ...options,
    };
  }

  /**
   * Formatea un log entry con metadata
   */
  private formatLog(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata,
    options?: LoggerOptions
  ): string {
    const opts = { ...this.defaultOptions, ...options };

    const timestamp = new Date().toISOString();

    const sanitizedMetadata = opts.sanitize && metadata
      ? sanitizeData(metadata)
      : metadata;

    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message: opts.sanitize ? redactSensitivePatterns(message) : message,
      ...sanitizedMetadata,
    };

    return JSON.stringify(logEntry, null, process.env.NODE_ENV === 'development' ? 2 : 0);
  }

  /**
   * Log de nivel ERROR
   */
  error(
    message: string,
    error?: Error | unknown,
    metadata?: LogMetadata,
    options?: LoggerOptions
  ): void {
    const opts = { ...this.defaultOptions, ...options };

    const errorMetadata: LogMetadata = {
      ...metadata,
    };

    if (error instanceof Error) {
      errorMetadata.error = {
        name: error.name,
        message: opts.sanitize ? redactSensitivePatterns(error.message) : error.message,
        stack: opts.includeStackTrace ? sanitizeStackTrace(error.stack) : undefined,
      };
    } else if (error) {
      errorMetadata.error = opts.sanitize ? sanitizeData({ error }) : error;
    }

    const logMessage = this.formatLog(LogLevel.ERROR, message, errorMetadata, opts);

    console.error(logMessage);
  }

  /**
   * Log de nivel WARN
   */
  warn(message: string, metadata?: LogMetadata, options?: LoggerOptions): void {
    const logMessage = this.formatLog(LogLevel.WARN, message, metadata, options);
    console.warn(logMessage);
  }

  /**
   * Log de nivel INFO
   */
  info(message: string, metadata?: LogMetadata, options?: LoggerOptions): void {
    const logMessage = this.formatLog(LogLevel.INFO, message, metadata, options);

  }

  /**
   * Log de nivel HTTP (para requests)
   */
  http(message: string, metadata?: LogMetadata, options?: LoggerOptions): void {
    const logMessage = this.formatLog(LogLevel.HTTP, message, metadata, options);

    // Solo loggear HTTP en desarrollo o si está habilitado
    if (process.env.NODE_ENV === 'development' || process.env.LOG_HTTP === 'true') {

    }
  }

  /**
   * Log de nivel DEBUG
   */
  debug(message: string, metadata?: LogMetadata, options?: LoggerOptions): void {
    // Solo loggear DEBUG en desarrollo
    if (process.env.NODE_ENV === 'development') {
      const logMessage = this.formatLog(LogLevel.DEBUG, message, metadata, options);

    }
  }

  /**
   * Crea un child logger con contexto adicional
   */
  child(context: string, options?: LoggerOptions): SecureLogger {
    return new SecureLogger(`${this.context}:${context}`, {
      ...this.defaultOptions,
      ...options,
    });
  }
}

/**
 * Instancia global del logger
 */
export const logger = new SecureLogger('AprendeYAplica');

/**
 * Factory para crear loggers con contexto específico
 *
 * @example
 * const authLogger = createLogger('Auth');
 * authLogger.info('User logged in', { userId: '123' });
 */
export function createLogger(context: string, options?: LoggerOptions): SecureLogger {
  return new SecureLogger(context, options);
}

/**
 * Helper para loggear requests HTTP de forma segura
 *
 * @example
 * logRequest(request, { userId: '123', action: 'login' });
 */
export function logRequest(
  request: Request,
  metadata?: LogMetadata,
  options?: LoggerOptions
): void {
  const { method, url } = request;

  const requestLogger = logger.child('HTTP');

  requestLogger.http(`${method} ${url}`, {
    method,
    url: redactSensitivePatterns(url),
    headers: sanitizeData({
      'user-agent': request.headers.get('user-agent'),
      'content-type': request.headers.get('content-type'),
      // NO loggear Authorization header
    }),
    ...metadata,
  }, options);
}

/**
 * Helper para loggear errores de forma segura
 *
 * @example
 * try {
 *   // código
 * } catch (error) {
 *   logError('Error al procesar pago', error, { userId: '123' });
 * }
 */
export function logError(
  message: string,
  error: Error | unknown,
  metadata?: LogMetadata,
  options?: LoggerOptions
): void {
  logger.error(message, error, metadata, options);
}

/**
 * Middleware para Next.js que logguea requests y errores
 *
 * Uso en app/api/[route]/route.ts:
 *
 * ```ts
 * export async function POST(request: Request) {
 *   logRequest(request, { endpoint: 'create-user' });
 *
 *   try {
 *     // tu lógica
 *   } catch (error) {
 *     logError('Error creando usuario', error);
 *     throw error;
 *   }
 * }
 * ```
 */
export { SecureLogger };

/**
 * Ejemplo de uso completo:
 *
 * ```ts
 * import { logger, createLogger, logRequest, logError } from '@/lib/logger/secure-logger';
 *
 * // Logger global
 * logger.info('Aplicación iniciada');
 *
 * // Logger con contexto
 * const authLogger = createLogger('Auth');
 * authLogger.info('Usuario autenticado', { userId: '123' });
 *
 * // Loggear requests
 * logRequest(request, { action: 'login' });
 *
 * // Loggear errores
 * try {
 *   throw new Error('Test error');
 * } catch (error) {
 *   logError('Error en autenticación', error, { userId: '123' });
 * }
 * ```
 */
