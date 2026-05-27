import {
  incrementCounter,
  observeDurationSeconds,
} from '@/lib/observability/metrics'

export type CircuitBreakerState = 'closed' | 'open' | 'half-open'

export interface CircuitBreakerOptions {
  name: string
  timeoutMs: number
  errorThresholdPercentage: number
  resetTimeoutMs: number
  rollingWindowMs?: number
  minimumRequestCount?: number
  maxRetries?: number
  retryBaseDelayMs?: number
  retryMaxDelayMs?: number
  shouldRetry?: (error: unknown, attempt: number) => boolean
  shouldRecordFailure?: (error: unknown) => boolean
}

export interface CircuitBreakerSnapshot {
  name: string
  state: CircuitBreakerState
  failures: number
  successes: number
  total: number
  failureRate: number
  openedAt?: string
  nextAttemptAt?: string
}

type CircuitBreakerEvent = {
  ok: boolean
  timestamp: number
}

export class CircuitBreakerOpenError extends Error {
  constructor(
    readonly provider: string,
    readonly retryAfterMs: number,
  ) {
    super(`Circuit breaker abierto para ${provider}`)
    this.name = 'CircuitBreakerOpenError'
  }
}

export class OperationTimeoutError extends Error {
  constructor(readonly timeoutMs: number) {
    super(`Operacion excedio ${timeoutMs} ms`)
    this.name = 'OperationTimeoutError'
  }
}

export class ExternalHttpError extends Error {
  constructor(
    readonly provider: string,
    readonly status: number,
    readonly bodyPreview?: string,
  ) {
    super(`Proveedor ${provider} respondio HTTP ${status}`)
    this.name = 'ExternalHttpError'
  }
}

const DEFAULT_ROLLING_WINDOW_MS = 60_000
const DEFAULT_MINIMUM_REQUESTS = 5
const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export const CIRCUIT_BREAKER_DEFAULTS = {
  database: {
    timeoutMs: 5_000,
    errorThresholdPercentage: 50,
    resetTimeoutMs: 30_000,
    maxRetries: 0,
  },
  openai: {
    timeoutMs: 30_000,
    errorThresholdPercentage: 50,
    resetTimeoutMs: 60_000,
    maxRetries: 1,
    retryBaseDelayMs: 500,
    retryMaxDelayMs: 2_000,
  },
  gemini: {
    timeoutMs: 30_000,
    errorThresholdPercentage: 50,
    resetTimeoutMs: 60_000,
    maxRetries: 1,
    retryBaseDelayMs: 500,
    retryMaxDelayMs: 2_000,
  },
  googleCalendar: {
    timeoutMs: 10_000,
    errorThresholdPercentage: 50,
    resetTimeoutMs: 60_000,
    maxRetries: 1,
    retryBaseDelayMs: 300,
    retryMaxDelayMs: 1_500,
  },
  externalFetch: {
    timeoutMs: 10_000,
    errorThresholdPercentage: 50,
    resetTimeoutMs: 60_000,
    maxRetries: 1,
    retryBaseDelayMs: 300,
    retryMaxDelayMs: 1_500,
  },
} as const

class CircuitBreaker {
  private state: CircuitBreakerState = 'closed'
  private openedAt: number | null = null
  private halfOpenProbeInFlight = false
  private events: CircuitBreakerEvent[] = []

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(operation: (signal: AbortSignal) => Promise<T>): Promise<T> {
    this.assertCanExecute()
    const startedAt = performance.now()

    try {
      const result = await this.executeWithRetries(operation)
      this.recordSuccess()
      this.recordMetrics('success', startedAt)
      return result
    } catch (error) {
      // Caller-initiated aborts are not service failures — never penalise the circuit.
      const isCallerAbort = error instanceof DOMException && error.name === 'AbortError'
      if (!isCallerAbort) {
        if (this.options.shouldRecordFailure?.(error) ?? true) {
          this.recordFailure()
        }
        this.recordMetrics('failure', startedAt)
      }
      throw error
    } finally {
      this.halfOpenProbeInFlight = false
    }
  }

  snapshot(): CircuitBreakerSnapshot {
    this.pruneEvents()
    const failures = this.events.filter((event) => !event.ok).length
    const successes = this.events.length - failures
    const failureRate = this.events.length === 0 ? 0 : (failures / this.events.length) * 100
    const nextAttemptAt = this.openedAt
      ? new Date(this.openedAt + this.options.resetTimeoutMs).toISOString()
      : undefined

    return {
      name: this.options.name,
      state: this.state,
      failures,
      successes,
      total: this.events.length,
      failureRate,
      openedAt: this.openedAt ? new Date(this.openedAt).toISOString() : undefined,
      nextAttemptAt,
    }
  }

  reset() {
    this.state = 'closed'
    this.openedAt = null
    this.halfOpenProbeInFlight = false
    this.events = []
  }

  private assertCanExecute() {
    const now = Date.now()

    if (this.state !== 'open') {
      if (this.state === 'half-open' && this.halfOpenProbeInFlight) {
        this.recordOpenRejection(this.options.resetTimeoutMs)
        throw new CircuitBreakerOpenError(this.options.name, this.options.resetTimeoutMs)
      }
      this.halfOpenProbeInFlight = this.state === 'half-open'
      return
    }

    const retryAfterMs = Math.max(
      0,
      (this.openedAt ?? now) + this.options.resetTimeoutMs - now,
    )

    if (retryAfterMs > 0) {
      this.recordOpenRejection(retryAfterMs)
      throw new CircuitBreakerOpenError(this.options.name, retryAfterMs)
    }

    this.state = 'half-open'
    this.halfOpenProbeInFlight = true
  }

  private async executeWithRetries<T>(
    operation: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> {
    const maxRetries = this.options.maxRetries ?? 0
    let attempt = 0
    let lastError: unknown

    while (attempt <= maxRetries) {
      try {
        return await runWithTimeout(operation, this.options.timeoutMs)
      } catch (error) {
        lastError = error
        const nextAttempt = attempt + 1
        const canRetry = nextAttempt <= maxRetries
          && (this.options.shouldRetry?.(error, nextAttempt) ?? isTransientOperationError(error))

        if (!canRetry) break

        await delay(getBackoffDelayMs(this.options, nextAttempt))
        attempt = nextAttempt
      }
    }

    throw lastError
  }

  private recordSuccess() {
    if (this.state === 'half-open') {
      this.reset()
      return
    }

    this.events.push({ ok: true, timestamp: Date.now() })
    this.pruneEvents()
  }

  private recordFailure() {
    const now = Date.now()
    this.events.push({ ok: false, timestamp: now })
    this.pruneEvents()

    if (this.state === 'half-open') {
      this.open(now)
      return
    }

    const minimumRequestCount = this.options.minimumRequestCount ?? DEFAULT_MINIMUM_REQUESTS
    if (this.events.length < minimumRequestCount) return

    const failures = this.events.filter((event) => !event.ok).length
    const failureRate = (failures / this.events.length) * 100
    if (failureRate >= this.options.errorThresholdPercentage) {
      this.open(now)
    }
  }

  private open(now: number) {
    this.state = 'open'
    this.openedAt = now
    this.halfOpenProbeInFlight = false
    incrementCounter('circuit_breaker_open_total', {
      provider: this.options.name,
    })
  }

  private pruneEvents() {
    const rollingWindowMs = this.options.rollingWindowMs ?? DEFAULT_ROLLING_WINDOW_MS
    const cutoff = Date.now() - rollingWindowMs
    this.events = this.events.filter((event) => event.timestamp >= cutoff)
  }

  private recordMetrics(outcome: 'success' | 'failure', startedAt: number) {
    const durationSeconds = Math.max(0, performance.now() - startedAt) / 1000
    incrementCounter('external_api_requests_total', {
      provider: this.options.name,
      outcome,
      state: this.state,
    })
    observeDurationSeconds('external_api_duration_seconds', durationSeconds, {
      provider: this.options.name,
      outcome,
    })
  }

  private recordOpenRejection(retryAfterMs: number) {
    incrementCounter('circuit_breaker_rejected_total', {
      provider: this.options.name,
    })
    observeDurationSeconds('circuit_breaker_retry_after_seconds', retryAfterMs / 1000, {
      provider: this.options.name,
    })
  }
}

const breakers = new Map<string, CircuitBreaker>()

export async function executeWithCircuitBreaker<T>(
  name: string,
  operation: (signal: AbortSignal) => Promise<T>,
  options: Omit<CircuitBreakerOptions, 'name'>,
): Promise<T> {
  const breaker = getCircuitBreaker({ ...options, name })
  return breaker.execute(operation)
}

export async function fetchWithCircuitBreaker(
  provider: string,
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: Partial<Omit<CircuitBreakerOptions, 'name'>> = {},
): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase()
  const canRetry = IDEMPOTENT_METHODS.has(method)
  const defaults = resolveProviderDefaults(provider)

  return executeWithCircuitBreaker(
    provider,
    async (breakerSignal) => {
      const response = await fetch(input, {
        ...init,
        signal: mergeAbortSignals(init.signal, breakerSignal),
      })

      if (isTransientHttpStatus(response.status)) {
        throw new ExternalHttpError(provider, response.status, await readBodyPreview(response))
      }

      return response
    },
    {
      ...defaults,
      ...options,
      maxRetries: canRetry ? (options.maxRetries ?? defaults.maxRetries) : 0,
    },
  )
}

export function getCircuitBreakerSnapshot(name: string): CircuitBreakerSnapshot | null {
  return breakers.get(name)?.snapshot() ?? null
}

export function getCircuitBreakerSnapshots(): CircuitBreakerSnapshot[] {
  return Array.from(breakers.values()).map((breaker) => breaker.snapshot())
}

export function resetCircuitBreaker(name: string): void {
  breakers.get(name)?.reset()
}

function getCircuitBreaker(options: CircuitBreakerOptions): CircuitBreaker {
  const existing = breakers.get(options.name)
  if (existing) return existing

  const breaker = new CircuitBreaker(options)
  breakers.set(options.name, breaker)
  return breaker
}

function resolveProviderDefaults(provider: string): Omit<CircuitBreakerOptions, 'name'> {
  if (provider.includes('openai')) return CIRCUIT_BREAKER_DEFAULTS.openai
  if (provider.includes('gemini')) return CIRCUIT_BREAKER_DEFAULTS.gemini
  if (provider.includes('calendar') || provider.includes('google-oauth')) {
    return CIRCUIT_BREAKER_DEFAULTS.googleCalendar
  }
  return CIRCUIT_BREAKER_DEFAULTS.externalFetch
}

function isTransientOperationError(error: unknown): boolean {
  return error instanceof OperationTimeoutError
    || error instanceof ExternalHttpError
    || error instanceof TypeError
}

function isTransientHttpStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500
}

function getBackoffDelayMs(
  options: CircuitBreakerOptions,
  attempt: number,
): number {
  const base = options.retryBaseDelayMs ?? 250
  const max = options.retryMaxDelayMs ?? 2_000
  return Math.min(max, base * 2 ** Math.max(0, attempt - 1))
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function runWithTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController()
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort()
      reject(new OperationTimeoutError(timeoutMs))
    }, timeoutMs)
  })

  try {
    return await Promise.race([operation(controller.signal), timeout])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

function mergeAbortSignals(
  first: AbortSignal | null | undefined,
  second: AbortSignal,
): AbortSignal {
  if (!first) return second

  const controller = new AbortController()
  const abort = () => controller.abort()

  if (first.aborted || second.aborted) {
    controller.abort()
    return controller.signal
  }

  first.addEventListener('abort', abort, { once: true })
  second.addEventListener('abort', abort, { once: true })
  return controller.signal
}

async function readBodyPreview(response: Response): Promise<string | undefined> {
  try {
    return (await response.clone().text()).slice(0, 500)
  } catch {
    return undefined
  }
}
