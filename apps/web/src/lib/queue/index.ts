import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker'

export const QUEUE_RETRY_ATTEMPTS = 3
export const QUEUE_RETRY_DELAY_EXPRESSION = '1000 * pow(4, retried)'

export type QueueJobName =
  | 'activity.validate-ai'
  | 'certificate.generate'
  | 'lia.chat.long-response'
  | 'users.bulk-import'
  | 'video.transcode'

export interface QueueJobEnvelope<TPayload> {
  dedupKey: string
  enqueuedAt: string
  jobId: string
  jobName: QueueJobName
  payload: TPayload
}

export interface EnqueueQueueJobParams<TPayload> {
  dedupKey: string
  failureCallbackPath?: string
  jobId?: string
  jobName: QueueJobName
  payload: TPayload
  providerDedupKey?: string
  targetPath: string
}

export interface QueueEnqueueResult {
  deduplicated?: boolean
  jobId?: string
  messageId?: string
  provider: 'none' | 'qstash'
  queued: boolean
  reason?: 'missing_base_url' | 'missing_internal_secret' | 'missing_token' | 'publish_failed'
  status?: number
}

interface QStashPublishResponse {
  deduplicated?: boolean
  messageId?: string
}

export function isQueueProviderConfigured(): boolean {
  return Boolean(
    process.env.QSTASH_TOKEN &&
      process.env.QUEUE_INTERNAL_SECRET &&
      getAppBaseUrl(),
  )
}

export async function enqueueQueueJob<TPayload>(
  params: EnqueueQueueJobParams<TPayload>,
): Promise<QueueEnqueueResult> {
  const token = process.env.QSTASH_TOKEN
  if (!token) return { provider: 'none', queued: false, reason: 'missing_token' }

  const internalSecret = process.env.QUEUE_INTERNAL_SECRET
  if (!internalSecret) {
    return { provider: 'none', queued: false, reason: 'missing_internal_secret' }
  }

  const appBaseUrl = getAppBaseUrl()
  if (!appBaseUrl) {
    return { provider: 'none', queued: false, reason: 'missing_base_url' }
  }

  const destinationUrl = new URL(params.targetPath, appBaseUrl).toString()
  const failureCallbackUrl = params.failureCallbackPath
    ? new URL(params.failureCallbackPath, appBaseUrl).toString()
    : undefined
  const jobId = params.jobId ?? createQueueJobId(params.jobName)
  const envelope: QueueJobEnvelope<TPayload> = {
    dedupKey: params.dedupKey,
    enqueuedAt: new Date().toISOString(),
    jobId,
    jobName: params.jobName,
    payload: params.payload,
  }

  const headers = buildQStashHeaders({
    dedupKey: params.providerDedupKey ?? params.dedupKey,
    failureCallbackUrl,
    internalSecret,
    jobName: params.jobName,
    token,
  })

  const response = await fetchWithCircuitBreaker(
    'qstash-queue',
    `https://qstash.upstash.io/v2/publish/${destinationUrl}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(envelope),
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    return {
      provider: 'qstash',
      queued: false,
      reason: 'publish_failed',
      status: response.status,
    }
  }

  const result = (await response.json().catch(() => ({}))) as QStashPublishResponse

  return {
    deduplicated: result.deduplicated,
    jobId,
    messageId: result.messageId,
    provider: 'qstash',
    queued: true,
    status: response.status,
  }
}

function buildQStashHeaders(params: {
  dedupKey: string
  failureCallbackUrl?: string
  internalSecret: string
  jobName: QueueJobName
  token: string
}): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${params.token}`,
    'Content-Type': 'application/json',
    'Upstash-Deduplication-Id': params.dedupKey,
    'Upstash-Forward-Authorization': `Bearer ${params.internalSecret}`,
    'Upstash-Label': params.jobName,
    'Upstash-Redact-Fields': 'body, header[Authorization]',
    'Upstash-Retries': QUEUE_RETRY_ATTEMPTS.toString(),
    'Upstash-Retry-Delay': QUEUE_RETRY_DELAY_EXPRESSION,
    'Upstash-Timeout': '30s',
  }

  if (params.failureCallbackUrl) {
    headers['Upstash-Failure-Callback'] = params.failureCallbackUrl
    headers['Upstash-Failure-Callback-Forward-Authorization'] =
      `Bearer ${params.internalSecret}`
  }

  return headers
}

export function createQueueJobId(jobName: QueueJobName): string {
  const randomId = crypto.randomUUID()
  return `${jobName}:${randomId}`
}

function getAppBaseUrl(): string | null {
  return (
    process.env.SOFIA_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NETLIFY_URL ||
    process.env.URL ||
    process.env.DEPLOY_URL ||
    null
  )
}
