import { createHmac, timingSafeEqual } from 'node:crypto'

const DEFAULT_SIGNING_SECRET = 'soflia-dev-security-key-change-me'

interface SignedTokenPayload {
  exp?: number
}

function getSigningSecret() {
  return (
    process.env.SOFLIA_SECURITY_SIGNING_KEY ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    DEFAULT_SIGNING_SECRET
  )
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
