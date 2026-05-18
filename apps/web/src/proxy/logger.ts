import { logger as techDebtLogger } from '@/lib/utils/logger'
const isDevelopment = process.env.NODE_ENV === 'development'

export const proxyLogger = {
  log: (message?: unknown, ...args: unknown[]) => {
    if (isDevelopment) techDebtLogger.log(message, ...args)
  },
  error: (message: unknown, ...args: unknown[]) => techDebtLogger.error(message, ...args),
  warn: (message: unknown, ...args: unknown[]) => {
    if (isDevelopment) techDebtLogger.warn(message, ...args)
  },
}

export type ProxyLogger = typeof proxyLogger
