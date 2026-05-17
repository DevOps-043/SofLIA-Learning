const isDevelopment = process.env.NODE_ENV === 'development'

export const proxyLogger = {
  log: (...args: unknown[]) => { if (isDevelopment) console.log(...args) },
  error: (...args: unknown[]) => console.error(...args),
  warn: (...args: unknown[]) => { if (isDevelopment) console.warn(...args) },
}

export type ProxyLogger = typeof proxyLogger
