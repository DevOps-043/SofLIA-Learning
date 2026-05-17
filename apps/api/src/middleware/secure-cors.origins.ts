import { config } from '../config/env'

function parseAllowedOrigins() {
  return config.ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function findInsecureProductionOrigins(origins: string[]) {
  return origins.filter((origin) => {
    return (
      origin === '*' ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.startsWith('http://')
    )
  })
}

function assertProductionOriginsAreConfigured(origins: string[]) {
  if (origins.length === 0) {
    throw new Error(
      'SECURITY ERROR: No hay origenes validos configurados en ALLOWED_ORIGINS.',
    )
  }
}

function assertProductionOriginsAreSecure(origins: string[]) {
  const insecureOrigins = findInsecureProductionOrigins(origins)

  if (insecureOrigins.length > 0) {
    throw new Error(
      `SECURITY ERROR: Origenes inseguros detectados en produccion:\n${insecureOrigins.join('\n')}`,
    )
  }
}

export function validateCORSConfiguration() {
  if (config.NODE_ENV !== 'production') {
    return
  }

  if (!config.ALLOWED_ORIGINS) {
    throw new Error(
      'SECURITY ERROR: ALLOWED_ORIGINS no esta configurado en produccion.',
    )
  }

  const origins = parseAllowedOrigins()
  assertProductionOriginsAreConfigured(origins)
  assertProductionOriginsAreSecure(origins)
}

export function getAllowedOrigins(): string[] {
  if (config.ALLOWED_ORIGINS) {
    return parseAllowedOrigins()
  }

  if (config.NODE_ENV === 'development' || config.NODE_ENV === 'test') {
    return ['http://localhost:3000']
  }

  throw new Error('ALLOWED_ORIGINS no esta configurado')
}

export function validateRequestOrigin(origin: string | undefined) {
  if (!origin && config.NODE_ENV !== 'production') {
    return true
  }

  if (!origin && config.NODE_ENV === 'production') {
    throw new Error('Origin header is required')
  }

  if (origin && getAllowedOrigins().includes(origin)) {
    return true
  }

  throw new Error(`Origin ${origin} is not allowed by CORS`)
}
