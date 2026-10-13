import { logger } from '../../apps/web/src/lib/logger'

export interface JobResponse {
  body: string
  headers: Record<string, string>
  statusCode: number
}

function jsonResponse(statusCode: number, error: string): JobResponse {
  return {
    statusCode,
    body: JSON.stringify({ success: false, error }),
    headers: { 'content-type': 'application/json' },
  }
}

/** Keep the scheduled caller bounded, including reading the response body. */
export async function callJob(input: {
  pathname: string
  secret: string | undefined
  method?: 'GET' | 'POST'
  timeoutMs?: number
}): Promise<JobResponse> {
  const siteUrl = process.env.URL || process.env.NEXT_PUBLIC_SITE_URL
  if (!input.secret) return jsonResponse(500, 'SCHEDULED_JOB_SECRET_NOT_CONFIGURED')
  if (!siteUrl) return jsonResponse(500, 'SITE_URL_NOT_CONFIGURED')

  try {
    const response = await fetch(new URL(input.pathname, siteUrl), {
      method: input.method ?? 'POST',
      headers: { Authorization: `Bearer ${input.secret}` },
      signal: AbortSignal.timeout(input.timeoutMs ?? 25_000),
      redirect: 'error',
    })
    return {
      statusCode: response.status,
      body: await response.text(),
      headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' },
    }
  } catch (error) {
    const timedOut = error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)
    logger.error('scheduled-job.request_failed', { pathname: input.pathname, timedOut })
    return jsonResponse(timedOut ? 504 : 502, timedOut ? 'JOB_REQUEST_TIMEOUT' : 'JOB_REQUEST_FAILED')
  }
}

