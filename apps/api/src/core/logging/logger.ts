type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private readonly isDevelopment = process.env.NODE_ENV === 'development'

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ) {
    const timestamp = new Date().toISOString()
    const contextText = context ? ` | ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level}] ${message}${contextText}`
  }

  private sanitizeValue(value: unknown): unknown {
    if (!value || typeof value !== 'object') {
      return value
    }

    if (Array.isArray(value)) {
      return value.map((entry) => this.sanitizeValue(entry))
    }

    const sensitiveKeys = new Set([
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
    ])

    const sanitizedEntries = Object.entries(value as Record<string, unknown>).map(
      ([key, nestedValue]) => [
        key,
        sensitiveKeys.has(key) ? '[REDACTED]' : this.sanitizeValue(nestedValue),
      ],
    )

    return Object.fromEntries(sanitizedEntries)
  }

  debug(message: string, context?: LogContext) {
    if (!this.isDevelopment) {
      return
    }

    console.debug(
      this.formatMessage('DEBUG', message, this.sanitizeValue(context) as LogContext),
    )
  }

  info(message: string, context?: LogContext) {
    console.info(
      this.formatMessage('INFO', message, this.sanitizeValue(context) as LogContext),
    )
  }

  warn(message: string, context?: LogContext) {
    console.warn(
      this.formatMessage('WARN', message, this.sanitizeValue(context) as LogContext),
    )
  }

  error(message: string, error?: unknown, context?: LogContext) {
    const payload =
      error instanceof Error
        ? {
            ...context,
            error: {
              message: error.message,
              name: error.name,
              stack: this.isDevelopment ? error.stack : undefined,
            },
          }
        : {
            ...context,
            error,
          }

    console.error(
      this.formatMessage('ERROR', message, this.sanitizeValue(payload) as LogContext),
    )
  }

  auth(action: string, context?: LogContext) {
    this.info(`Auth: ${action}`, context)
  }

  api(method: string, path: string, statusCode?: number, context?: LogContext) {
    this.info(`API ${method} ${path}${statusCode ? ` - ${statusCode}` : ''}`, context)
  }
}

export const logger = new Logger()
export { Logger }
