import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CircuitBreakerOpenError,
  ExternalHttpError,
  OperationTimeoutError,
  executeWithCircuitBreaker,
  fetchWithCircuitBreaker,
  getCircuitBreakerSnapshot,
  resetCircuitBreaker,
} from '../circuit-breaker'

const baseOptions = {
  timeoutMs: 100,
  errorThresholdPercentage: 50,
  resetTimeoutMs: 1_000,
  minimumRequestCount: 2,
  maxRetries: 0,
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  resetCircuitBreaker('mass-failure')
  resetCircuitBreaker('half-open')
  resetCircuitBreaker('timeout')
  resetCircuitBreaker('fetch-transient')
})

describe('circuit breaker', () => {
  it('opens after repeated provider failures and blocks the next call', async () => {
    let calls = 0
    const failingOperation = async () => {
      calls += 1
      throw new Error('provider down')
    }

    await expect(executeWithCircuitBreaker('mass-failure', failingOperation, baseOptions))
      .rejects.toThrow('provider down')
    await expect(executeWithCircuitBreaker('mass-failure', failingOperation, baseOptions))
      .rejects.toThrow('provider down')

    expect(getCircuitBreakerSnapshot('mass-failure')?.state).toBe('open')
    await expect(executeWithCircuitBreaker('mass-failure', failingOperation, baseOptions))
      .rejects.toBeInstanceOf(CircuitBreakerOpenError)
    expect(calls).toBe(2)
  })

  it('allows a successful half-open probe after reset timeout', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-18T12:00:00.000Z'))

    const failingOperation = async () => {
      throw new Error('provider down')
    }

    await expect(executeWithCircuitBreaker('half-open', failingOperation, baseOptions))
      .rejects.toThrow('provider down')
    await expect(executeWithCircuitBreaker('half-open', failingOperation, baseOptions))
      .rejects.toThrow('provider down')

    vi.setSystemTime(new Date('2026-05-18T12:00:01.001Z'))

    await expect(executeWithCircuitBreaker('half-open', async () => 'ok', baseOptions))
      .resolves.toBe('ok')
    expect(getCircuitBreakerSnapshot('half-open')?.state).toBe('closed')
  })

  it('fails controlled when an operation exceeds the configured timeout', async () => {
    vi.useFakeTimers()

    const promise = executeWithCircuitBreaker(
      'timeout',
      () => new Promise<string>((resolve) => {
        setTimeout(() => resolve('late'), 1_000)
      }),
      baseOptions,
    )
    const expectation = expect(promise).rejects.toBeInstanceOf(OperationTimeoutError)

    await vi.advanceTimersByTimeAsync(100)
    await expectation
  })

  it('retries transient idempotent fetch failures before surfacing the provider error', async () => {
    const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>()
      .mockResolvedValue(new Response('unavailable', { status: 503 }))

    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchWithCircuitBreaker(
      'fetch-transient',
      'https://example.test/api',
      { method: 'GET' },
      { ...baseOptions, maxRetries: 1 },
    )).rejects.toBeInstanceOf(ExternalHttpError)

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
