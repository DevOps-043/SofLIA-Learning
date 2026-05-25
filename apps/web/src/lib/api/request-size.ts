import { NextRequest, NextResponse } from 'next/server'

import { incrementCounter } from '@/lib/observability/metrics'

export const JSON_BODY_LIMIT_BYTES = 1_048_576

const METHODS_WITH_BODY = new Set(['PATCH', 'POST', 'PUT'])
const BODY_SIZE_EXEMPT_PATH_SEGMENTS = [
  '/import',
  '/scorm/upload',
  '/upload',
  '/uploads',
]

export function isBodySizeGuardedPath(pathname: string): boolean {
  if (!pathname.startsWith('/api/')) return false
  return !BODY_SIZE_EXEMPT_PATH_SEGMENTS.some((segment) =>
    pathname.includes(segment),
  )
}

export function parseContentLength(value: string | null): number | null {
  if (!value) return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return Math.floor(parsed)
}

export function rejectOversizedRequest(
  request: NextRequest,
  limitBytes = JSON_BODY_LIMIT_BYTES,
): NextResponse | null {
  if (!METHODS_WITH_BODY.has(request.method)) return null
  if (!isBodySizeGuardedPath(request.nextUrl.pathname)) return null

  const contentLength = parseContentLength(request.headers.get('content-length'))
  if (contentLength === null || contentLength <= limitBytes) return null

  incrementCounter('http_request_body_rejected_total', {
    method: request.method,
    reason: 'payload_too_large',
  })

  return NextResponse.json(
    {
      error: 'PAYLOAD_TOO_LARGE',
      maxBytes: limitBytes,
    },
    { status: 413 },
  )
}
