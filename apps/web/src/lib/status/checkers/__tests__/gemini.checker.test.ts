import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { ServiceStatus, StatusErrorClassification } from '@aprende-y-aplica/shared'

import {
  CircuitBreakerOpenError,
  ExternalHttpError,
  OperationTimeoutError,
} from '@/lib/resilience/circuit-breaker'
import {
  AI_STATUS_CHECK_MAX_OUTPUT_TOKENS,
  classifyGeminiError,
} from '../gemini.checker'
import { describeAiProviderCredentialIssue } from '@/lib/ai/providers/ai-text-gateway.server'

// Shape thrown by @google/generative-ai (GoogleGenerativeAIFetchError): carries a
// numeric `status` field and embeds the code + API reason in the message.
function sdkFetchError(status: number, message: string): Error {
  const error = new Error(message)
  ;(error as Error & { status: number }).status = status
  return error
}

describe('classifyGeminiError', () => {
  const originalOpenAiApiKey = process.env.OPENAI_API_KEY
  const originalMisspelledOpenAiApiKey = process.env.OPENAI_APY_KEY
  const originalOpenAiBaseUrl = process.env.OPENAI_BASE_URL
  const originalNetlifyGatewayBaseUrl = process.env.NETLIFY_AI_GATEWAY_BASE_URL
  const originalAllowNetlifyGateway = process.env.OPENAI_ALLOW_NETLIFY_AI_GATEWAY

  afterEach(() => {
    if (originalOpenAiApiKey === undefined) delete process.env.OPENAI_API_KEY
    else process.env.OPENAI_API_KEY = originalOpenAiApiKey

    if (originalMisspelledOpenAiApiKey === undefined) delete process.env.OPENAI_APY_KEY
    else process.env.OPENAI_APY_KEY = originalMisspelledOpenAiApiKey

    if (originalOpenAiBaseUrl === undefined) delete process.env.OPENAI_BASE_URL
    else process.env.OPENAI_BASE_URL = originalOpenAiBaseUrl

    if (originalNetlifyGatewayBaseUrl === undefined) delete process.env.NETLIFY_AI_GATEWAY_BASE_URL
    else process.env.NETLIFY_AI_GATEWAY_BASE_URL = originalNetlifyGatewayBaseUrl

    if (originalAllowNetlifyGateway === undefined) delete process.env.OPENAI_ALLOW_NETLIFY_AI_GATEWAY
    else process.env.OPENAI_ALLOW_NETLIFY_AI_GATEWAY = originalAllowNetlifyGateway
  })

  it('uses a probe budget accepted by OpenAI Responses', () => {
    expect(AI_STATUS_CHECK_MAX_OUTPUT_TOKENS).toBeGreaterThanOrEqual(16)
  })

  it('reports the OPENAI_APY_KEY typo without accepting it as a credential', () => {
    delete process.env.OPENAI_API_KEY
    delete process.env.OPENAI_BASE_URL
    delete process.env.NETLIFY_AI_GATEWAY_BASE_URL
    process.env.OPENAI_APY_KEY = 'configured-but-misnamed'

    expect(describeAiProviderCredentialIssue('openai')).toBe(
      'AI_API_KEY_MISNAMED:OPENAI_APY_KEY->OPENAI_API_KEY',
    )
  })

  it('rejects the automatically injected Netlify AI Gateway credential by default', () => {
    process.env.OPENAI_API_KEY = 'netlify-generated-key'
    process.env.OPENAI_BASE_URL = 'https://ai-gateway.netlify.example/openai'
    process.env.NETLIFY_AI_GATEWAY_BASE_URL = 'https://ai-gateway.netlify.example'
    delete process.env.OPENAI_APY_KEY
    delete process.env.OPENAI_ALLOW_NETLIFY_AI_GATEWAY

    expect(describeAiProviderCredentialIssue('openai')).toBe(
      'AI_CREDENTIAL_SOURCE_BLOCKED:NETLIFY_AI_GATEWAY',
    )
  })

  it('allows Netlify AI Gateway only with an explicit opt-in', () => {
    process.env.OPENAI_API_KEY = 'netlify-generated-key'
    process.env.OPENAI_BASE_URL = 'https://ai-gateway.netlify.example/openai'
    process.env.NETLIFY_AI_GATEWAY_BASE_URL = 'https://ai-gateway.netlify.example'
    process.env.OPENAI_ALLOW_NETLIFY_AI_GATEWAY = 'true'

    expect(describeAiProviderCredentialIssue('openai')).toBeNull()
  })

  it('classifies 429 RESOURCE_EXHAUSTED (quota/billing exhausted) as BILLING_QUOTA + DOWN', () => {
    const error = sdkFetchError(
      429,
      '[429 Too Many Requests] You exceeded your current quota, please check your plan and billing details. RESOURCE_EXHAUSTED',
    )

    const result = classifyGeminiError(error, 120)

    expect(result.status).toBe(ServiceStatus.DOWN)
    expect(result.errorClassification).toBe(StatusErrorClassification.BILLING_QUOTA)
    expect(result.latencyMs).toBe(120)
  })

  it('classifies 400 FAILED_PRECONDITION (billing not enabled) as BILLING_QUOTA + DOWN', () => {
    const error = sdkFetchError(
      400,
      '[400 Bad Request] User location is not supported for the API use without a billing account linked. FAILED_PRECONDITION',
    )

    const result = classifyGeminiError(error, 90)

    expect(result.status).toBe(ServiceStatus.DOWN)
    expect(result.errorClassification).toBe(StatusErrorClassification.BILLING_QUOTA)
  })

  it('classifies 429 embedded only in the message (older SDK shape, no status field) as BILLING_QUOTA', () => {
    const error = new Error('[429 Too Many Requests] Resource has been exhausted (e.g. check quota).')

    const result = classifyGeminiError(error, 100)

    expect(result.status).toBe(ServiceStatus.DOWN)
    expect(result.errorClassification).toBe(StatusErrorClassification.BILLING_QUOTA)
  })

  it('classifies ExternalHttpError 429 from the circuit breaker fetch path as BILLING_QUOTA', () => {
    const error = new ExternalHttpError('gemini-status-check', 429, 'quota exceeded')

    const result = classifyGeminiError(error, 80)

    expect(result.status).toBe(ServiceStatus.DOWN)
    expect(result.errorClassification).toBe(StatusErrorClassification.BILLING_QUOTA)
  })

  it('classifies a generic 500 as GENERIC_OUTAGE + DOWN', () => {
    const error = sdkFetchError(500, '[500 Internal Server Error] An internal error has occurred.')

    const result = classifyGeminiError(error, 300)

    expect(result.status).toBe(ServiceStatus.DOWN)
    expect(result.errorClassification).toBe(StatusErrorClassification.GENERIC_OUTAGE)
  })

  it('classifies OperationTimeoutError as TIMEOUT + DEGRADED', () => {
    const error = new OperationTimeoutError(8_000)

    const result = classifyGeminiError(error, 8_000)

    expect(result.status).toBe(ServiceStatus.DEGRADED)
    expect(result.errorClassification).toBe(StatusErrorClassification.TIMEOUT)
  })

  it('classifies CircuitBreakerOpenError as GENERIC_OUTAGE + DOWN without probing further', () => {
    const error = new CircuitBreakerOpenError('gemini-status-check', 30_000)

    const result = classifyGeminiError(error, 0)

    expect(result.status).toBe(ServiceStatus.DOWN)
    expect(result.errorClassification).toBe(StatusErrorClassification.GENERIC_OUTAGE)
    expect(result.errorDetail).toContain('circuit_breaker_open')
  })

  it('classifies a network failure without status code as GENERIC_OUTAGE', () => {
    const error = new TypeError('fetch failed')

    const result = classifyGeminiError(error, 50)

    expect(result.status).toBe(ServiceStatus.DOWN)
    expect(result.errorClassification).toBe(StatusErrorClassification.GENERIC_OUTAGE)
  })

  it('truncates very long provider error bodies in errorDetail', () => {
    const error = new Error('x'.repeat(2_000))

    const result = classifyGeminiError(error, 10)

    expect(result.errorDetail).not.toBeNull()
    expect(result.errorDetail!.length).toBeLessThanOrEqual(500)
  })
})
