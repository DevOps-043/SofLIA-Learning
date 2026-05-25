import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * Utilidad de logging que solo funciona en modo desarrollo
 * Reemplaza los logger.log directos en el código
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug'

interface LoggerOptions {
  context?: string
  timestamp?: boolean
  emoji?: boolean
}

class DevLogger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private getTimestamp(): string {
    return new Date().toISOString().split('T')[1].split('.')[0]
  }

  private getContextPrefix(context?: string): string {
    if (!context) return ''
    return `[${context}]`
  }

  private log(level: LogLevel, message: string, data?: unknown, options: LoggerOptions = {}) {
    if (!this.isDevelopment) return

    const { context, timestamp = true, emoji = true } = options

    const parts: string[] = []

    // Agregar timestamp
    if (timestamp) {
      parts.push(`⏰ ${this.getTimestamp()}`)
    }

    // Agregar contexto
    if (context) {
      parts.push(this.getContextPrefix(context))
    }

    // Agregar emoji según el nivel
    if (emoji) {
      const emojis: Record<LogLevel, string> = {
        log: '📝',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
        debug: '🔍',
      }
      parts.push(emojis[level])
    }

    // Agregar mensaje
    parts.push(message)

    // Log
    const logMessage = parts.join(' ')

    switch (level) {
      case 'debug':
        if (data !== undefined) {
          techDebtLogger.debug(logMessage, data)
        } else {
          techDebtLogger.debug(logMessage)
        }
        break
      case 'error':
        if (data !== undefined) {
          techDebtLogger.error(logMessage, data)
        } else {
          techDebtLogger.error(logMessage)
        }
        break
      case 'info':
        if (data !== undefined) {
          techDebtLogger.info(logMessage, data)
        } else {
          techDebtLogger.info(logMessage)
        }
        break
      case 'warn':
        if (data !== undefined) {
          techDebtLogger.warn(logMessage, data)
        } else {
          techDebtLogger.warn(logMessage)
        }
        break
      default:
        if (data !== undefined) {
          techDebtLogger.log(logMessage, data)
        } else {
          techDebtLogger.log(logMessage)
        }
        break
    }
  }

  /**
   * Log general
   */
  info(message: string, data?: unknown, options?: LoggerOptions) {
    this.log('log', message, data, options)
  }

  /**
   * Log de información
   */
  debug(message: string, data?: unknown, options?: LoggerOptions) {
    this.log('debug', message, data, options)
  }

  /**
   * Log de advertencia
   */
  warn(message: string, data?: unknown, options?: LoggerOptions) {
    this.log('warn', message, data, options)
  }

  /**
   * Log de error
   */
  error(message: string, error?: Error | unknown, options?: LoggerOptions) {
    this.log('error', message, error, options)
  }

  /**
   * Log de performance
   */
  performance(label: string, startTime: number, options?: LoggerOptions) {
    if (!this.isDevelopment) return

    const duration = performance.now() - startTime
    this.log('info', `${label} completado en ${duration.toFixed(2)}ms`, undefined, {
      ...options,
      emoji: true,
    })
  }

  /**
   * Timer para medir performance
   */
  time(label: string): () => void {
    if (!this.isDevelopment) return () => {}

    const startTime = performance.now()

    return () => {
      this.performance(label, startTime)
    }
  }

  /**
   * Agrupa logs relacionados
   */
  group(label: string, callback: () => void) {
    if (!this.isDevelopment) {
      callback()
      return
    }

    techDebtLogger.group(`📦 ${label}`)
    callback()
    techDebtLogger.groupEnd()
  }

}

// Exportar instancia singleton
export const logger = new DevLogger()

// Ejemplos de uso:
// logger.info('Usuario autenticado', { userId: user.id }, { context: 'Auth' })
// logger.warn('Cache miss', { key: 'user-profile' }, { context: 'Cache' })
// logger.error('Error al guardar', error, { context: 'Database' })
//
// const endTimer = logger.time('Fetch data')
// await fetchData()
// endTimer()
//
// logger.group('API Response', () => {
//   logger.info('Status', response.status)
//   logger.info('Data', response.data)
// })
