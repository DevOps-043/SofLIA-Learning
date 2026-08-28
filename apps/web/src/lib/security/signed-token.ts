import { createHmac, timingSafeEqual } from 'node:crypto'

const DEFAULT_SIGNING_SECRET = 'soflia-dev-security-key-change-me'
const MINIMUM_SIGNING_SECRET_LENGTH = 32

interface SignedTokenPayload {
  exp?: number
}

function getSigningSecret() {
  const configuredSecret = (
    process.env.SOFLIA_SECURITY_SIGNING_KEY ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_JWT_SECRET
  )

  if (configuredSecret) {
    if (configuredSecret.length < MINIMUM_SIGNING_SECRET_LENGTH) {
      throw new Error('Security signing secret must contain at least 32 characters')
    }

    return configuredSecret
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('SOFLIA_SECURITY_SIGNING_KEY is required in production')
  }

  return DEFAULT_SIGNING_SECRET
}

function createSignature(serializedPayload: string) {
  return createHmac('sha256', getSigningSecret())
    .update(serializedPayload)
    .digest('base64url')
}

export function signToken<T extends SignedTokenPayload>(payload: T) {
  const serializedPayload = JSON.stringify(payload)
  const encodedPayload = Buffer.from(serializedPayload, 'utf8').toString(
    'base64url',
  )
  const signature = createSignature(serializedPayload)

  return `${encodedPayload}.${signature}`
}

export function verifyToken<T extends SignedTokenPayload>(token?: string | null) {
  if (!token) {
    return null
  }

  const [encodedPayload, providedSignature] = token.split('.')

  if (!encodedPayload || !providedSignature) {
    return null
  }

  try {
    const serializedPayload = Buffer.from(encodedPayload, 'base64url').toString(
      'utf8',
    )
    const expectedSignature = createSignature(serializedPayload)

    if (providedSignature.length !== expectedSignature.length) {
      return null
    }

    const signatureMatches = timingSafeEqual(
      Buffer.from(providedSignature),
      Buffer.from(expectedSignature),
    )

    if (!signatureMatches) {
      return null
    }

    const parsedPayload = JSON.parse(serializedPayload) as T

    if (
      typeof parsedPayload.exp === 'number' &&
      Number.isFinite(parsedPayload.exp) &&
      Date.now() > parsedPayload.exp
    ) {
      return null
    }

    return parsedPayload
  } catch {
    return null
  }
}

export function getSecuritySigningSecret() {
  return getSigningSecret()
}
