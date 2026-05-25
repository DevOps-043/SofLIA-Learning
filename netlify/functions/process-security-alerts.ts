type NetlifyResponse = {
  body: string
  headers: Record<string, string>
  statusCode: number
}

type Handler = () => Promise<NetlifyResponse>

const handler: Handler = async () => {
  return callInternalJob('/api/internal/jobs/security-alerts')
}

async function callInternalJob(pathname: string) {
  const internalSecret = process.env.QUEUE_INTERNAL_SECRET
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL

  if (!internalSecret) {
    return jsonResponse(500, { success: false, error: 'QUEUE_INTERNAL_SECRET_NOT_CONFIGURED' })
  }

  if (!siteUrl) {
    return jsonResponse(500, { success: false, error: 'SITE_URL_NOT_CONFIGURED' })
  }

  const endpoint = `${siteUrl.replace(/\/$/, '')}${pathname}`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${internalSecret}`,
    },
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'INTERNAL_JOB_REQUEST_FAILED'
    return jobRequestErrorResponse(502, { success: false, error: message })
  })

  if ('statusCode' in response) {
    return response
  }

  const body = await response.text()

  return {
    statusCode: response.status,
    body,
    headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' },
  }
}

function jsonResponse(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  }
}

function jobRequestErrorResponse(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  }
}

export { handler }
