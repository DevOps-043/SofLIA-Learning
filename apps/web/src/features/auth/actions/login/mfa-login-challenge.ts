import crypto from 'node:crypto'

type HeaderReader = {
  get(name: string): string | null
}

export const LOGIN_MFA_CHALLENGE_COOKIE_NAME = 'soflia-login-mfa'

const CHALLENGE_TTL_MS = 5 * 60 * 1000
const MAX_CONTEXT_FIELD_LENGTH = 200

export interface LoginMfaChallengePayload {
  bulkInviteToken?: string
  emailOrUsername: string
  expiresAt: number
  fingerprint: string
  invitationToken?: string
  nonce: string
  organizationId?: string
  organizationSlug?: string
  rememberMe: boolean
  userId: string
}

export interface CreatedLoginMfaChallenge {
  nonce: string
  token: string
}

export class LoginMfaChallengeError extends Error {
  constructor(public code: string) {
    super(code)
    this.name = 'LoginMfaChallengeError'
  }
}

export function createLoginMfaChallenge(input: {
  emailOrUsername: string
  formData: FormData
  headers: HeaderReader
  rememberMe: boolean
  userId: string
}): CreatedLoginMfaChallenge {
  const payload: LoginMfaChallengePayload = {
    bulkInviteToken: readOptionalFormString(input.formData, 'bulkInviteToken'),
    emailOrUsername: input.emailOrUsername,
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
    fingerprint: buildRequestFingerprint(input.headers),
    invitationToken: readOptionalFormString(input.formData, 'invitationToken'),
    nonce: crypto.randomBytes(24).toString('base64url'),
    organizationId: readOptionalFormString(input.formData, 'organizationId'),
    organizationSlug: readOptionalFormString(input.formData, 'organizationSlug'),
    rememberMe: input.rememberMe,
    userId: input.userId,
  }

  const encodedPayload = Buffer
    .from(JSON.stringify(payload), 'utf8')
    .toString('base64url')

  return {
    nonce: payload.nonce,
    token: `${encodedPayload}.${signChallenge(encodedPayload)}`,
  }
}

export function verifyLoginMfaChallenge(input: {
  cookieNonce: string | undefined
  headers: HeaderReader
  token: string
}): LoginMfaChallengePayload {
  const tokenParts = input.token.split('.')
  const [encodedPayload, signature] = tokenParts
  if (tokenParts.length !== 2 || !encodedPayload || !signature) {
    throw new LoginMfaChallengeError('MFA_CHALLENGE_MALFORMED')
  }

  assertValidSignature(encodedPayload, signature)

  const payload = parseChallengePayload(encodedPayload)
  if (payload.expiresAt < Date.now()) {
    throw new LoginMfaChallengeError('MFA_CHALLENGE_EXPIRED')
  }

  if (!input.cookieNonce || input.cookieNonce !== payload.nonce) {
    throw new LoginMfaChallengeError('MFA_CHALLENGE_COOKIE_MISMATCH')
  }

  if (payload.fingerprint !== buildRequestFingerprint(input.headers)) {
    throw new LoginMfaChallengeError('MFA_CHALLENGE_CONTEXT_MISMATCH')
  }

  return payload
}

export function createLoginMfaChallengeCookieOptions() {
  return {
    httpOnly: true,
    maxAge: Math.floor(CHALLENGE_TTL_MS / 1000),
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  }
}

export function buildFormDataFromLoginMfaChallenge(
  payload: LoginMfaChallengePayload,
): FormData {
  const formData = new FormData()
  formData.set('emailOrUsername', payload.emailOrUsername)
  formData.set('rememberMe', String(payload.rememberMe))
  appendOptional(formData, 'organizationId', payload.organizationId)
  appendOptional(formData, 'organizationSlug', payload.organizationSlug)
  appendOptional(formData, 'invitationToken', payload.invitationToken)
  appendOptional(formData, 'bulkInviteToken', payload.bulkInviteToken)
  return formData
}

function readOptionalFormString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, MAX_CONTEXT_FIELD_LENGTH) : undefined
}

function appendOptional(formData: FormData, key: string, value: string | undefined) {
  if (value) {
    formData.set(key, value)
  }
}

function buildRequestFingerprint(headers: HeaderReader): string {
  const ip =
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  const userAgent = headers.get('user-agent') || 'unknown'
  return crypto
    .createHash('sha256')
    .update(`${ip}|${userAgent}`)
    .digest('base64url')
}

function getChallengeSecret(): string {
  const secret = process.env.MFA_LOGIN_CHALLENGE_SECRET || process.env.MFA_SECRET_KEY
  if (!secret || secret.length < 32) {
    throw new LoginMfaChallengeError('MFA_CHALLENGE_SECRET_MISSING')
  }
  return secret
}

function signChallenge(encodedPayload: string): string {
  return crypto
    .createHmac('sha256', getChallengeSecret())
    .update(encodedPayload)
    .digest('base64url')
}

function assertValidSignature(encodedPayload: string, signature: string) {
  const expected = signChallenge(encodedPayload)
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    throw new LoginMfaChallengeError('MFA_CHALLENGE_BAD_SIGNATURE')
  }
}

function parseChallengePayload(encodedPayload: string): LoginMfaChallengePayload {
  let rawPayload: unknown
  try {
    rawPayload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'))
  } catch {
    throw new LoginMfaChallengeError('MFA_CHALLENGE_INVALID_PAYLOAD')
  }

  if (!isChallengePayload(rawPayload)) {
    throw new LoginMfaChallengeError('MFA_CHALLENGE_INVALID_PAYLOAD')
  }

  return rawPayload
}

function isChallengePayload(value: unknown): value is LoginMfaChallengePayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const payload = value as Partial<LoginMfaChallengePayload>
  return (
    typeof payload.emailOrUsername === 'string' &&
    typeof payload.expiresAt === 'number' &&
    typeof payload.fingerprint === 'string' &&
    typeof payload.nonce === 'string' &&
    typeof payload.rememberMe === 'boolean' &&
    typeof payload.userId === 'string'
  )
}
