import crypto from 'crypto'

const LOCKOUT_WINDOW_MS = 15 * 60 * 1000
const MAX_FAILED_ATTEMPTS = 5
const KEY_PREFIX = 'soflia:auth-lockout:v1'
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_REST_TOKEN

type RedisCommandValue = string | number

interface RedisRestResponse<T> {
  error?: string
  result?: T
}

interface MemoryAttempt {
  count: number
  expiresAt: number
}

export interface LoginAttemptContext {
  identifier: string
  ip: string
}

export interface LoginLockoutStatus {
  attemptsRemaining: number
  isLocked: boolean
  lockedUntil?: Date
}

const memoryAttempts = new Map<string, MemoryAttempt>()

export function buildLoginAttemptContext(
  emailOrUsername: string,
  headersLike: { get(name: string): string | null },
): LoginAttemptContext {
  return {
    identifier: emailOrUsername.trim().toLowerCase(),
    ip:
      headersLike.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersLike.get('x-real-ip') ||
      'unknown',
  }
}

export async function getLoginLockoutStatus(
  context: LoginAttemptContext,
): Promise<LoginLockoutStatus> {
  if (hasRedisCredentials()) {
    return getRedisLockoutStatus(context)
  }

  return getMemoryLockoutStatus(context)
}

export async function recordFailedLoginAttempt(
  context: LoginAttemptContext,
): Promise<LoginLockoutStatus> {
  if (hasRedisCredentials()) {
    return recordRedisFailedAttempt(context)
  }

  return recordMemoryFailedAttempt(context)
}

export async function clearLoginLockout(context: LoginAttemptContext): Promise<void> {
  if (hasRedisCredentials()) {
    await executeRedisCommand<number>(['DEL', buildLoginAttemptKey(context)])
    return
  }

  memoryAttempts.delete(buildLoginAttemptKey(context))
}

export function buildLockoutErrorMessage(status: LoginLockoutStatus): string {
  const minutes = status.lockedUntil
    ? Math.max(1, Math.ceil((status.lockedUntil.getTime() - Date.now()) / 60000))
    : 15

  return `Demasiados intentos fallidos. Intenta de nuevo en ${minutes} minutos.`
}

export function clearMemoryLoginLockoutsForTests(): void {
  memoryAttempts.clear()
}

function getMemoryLockoutStatus(context: LoginAttemptContext): LoginLockoutStatus {
  const key = buildLoginAttemptKey(context)
  const now = Date.now()
  const entry = memoryAttempts.get(key)

  if (!entry || entry.expiresAt <= now) {
    memoryAttempts.delete(key)
    return unlockedStatus(0)
  }

  return statusFromCount(entry.count, entry.expiresAt)
}

function recordMemoryFailedAttempt(context: LoginAttemptContext): LoginLockoutStatus {
  const key = buildLoginAttemptKey(context)
  const now = Date.now()
  const current = memoryAttempts.get(key)
  const next =
    !current || current.expiresAt <= now
      ? { count: 1, expiresAt: now + LOCKOUT_WINDOW_MS }
      : { count: current.count + 1, expiresAt: current.expiresAt }

  memoryAttempts.set(key, next)
  return statusFromCount(next.count, next.expiresAt)
}

async function getRedisLockoutStatus(
  context: LoginAttemptContext,
): Promise<LoginLockoutStatus> {
  try {
    const key = buildLoginAttemptKey(context)
    const [countRaw, ttlMs] = await Promise.all([
      executeRedisCommand<string | null>(['GET', key]),
      executeRedisCommand<number>(['PTTL', key]),
    ])
    const count = countRaw ? Number(countRaw) : 0

    return statusFromCount(Number.isFinite(count) ? count : 0, Date.now() + ttlOrWindow(ttlMs))
  } catch {
    return getMemoryLockoutStatus(context)
  }
}

async function recordRedisFailedAttempt(
  context: LoginAttemptContext,
): Promise<LoginLockoutStatus> {
  try {
    const key = buildLoginAttemptKey(context)
    const count = await executeRedisCommand<number>(['INCR', key])

    if (count === 1) {
      await executeRedisCommand<number>(['PEXPIRE', key, LOCKOUT_WINDOW_MS])
    }

    const ttlMs = await executeRedisCommand<number>(['PTTL', key])
    return statusFromCount(count, Date.now() + ttlOrWindow(ttlMs))
  } catch {
    return recordMemoryFailedAttempt(context)
  }
}

async function executeRedisCommand<T>(command: readonly RedisCommandValue[]): Promise<T> {
  const response = await fetch(REDIS_URL!, {
    body: JSON.stringify(command),
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    signal: AbortSignal.timeout(2000),
  })

  if (!response.ok) {
    throw new Error(`Redis REST error ${response.status}`)
  }

  const payload = (await response.json()) as RedisRestResponse<T>
  if (payload.error) {
    throw new Error(payload.error)
  }

  return payload.result as T
}

function statusFromCount(count: number, expiresAt: number): LoginLockoutStatus {
  if (count >= MAX_FAILED_ATTEMPTS) {
    return {
      attemptsRemaining: 0,
      isLocked: true,
      lockedUntil: new Date(expiresAt),
    }
  }

  return unlockedStatus(count)
}

function unlockedStatus(count: number): LoginLockoutStatus {
  return {
    attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - count),
    isLocked: false,
  }
}

function buildLoginAttemptKey(context: LoginAttemptContext): string {
  const normalized = `${context.identifier}|${context.ip}`
  return `${KEY_PREFIX}:${crypto.createHash('sha256').update(normalized).digest('hex')}`
}

function hasRedisCredentials(): boolean {
  return Boolean(REDIS_URL && REDIS_TOKEN)
}

function ttlOrWindow(ttlMs: number): number {
  return ttlMs > 0 ? ttlMs : LOCKOUT_WINDOW_MS
}
