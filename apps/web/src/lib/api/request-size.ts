import { NextRequest, NextResponse } from 'next/server'

import { incrementCounter } from '@/lib/observability/metrics'

export const JSON_BODY_LIMIT_BYTES = 1_048_576

const METHODS_WITH_BODY = new Set(['PATCH', 'POST', 'PUT'])
const MB = 1024 * 1024
export const BUSINESS_USER_IMPORT_MAX_BYTES = 10 * MB
const MULTIPART_ROUTE_LIMITS: ReadonlyArray<{
  matches: (pathname: string) => boolean
  maxBytes: number
}> = [
  { matches: (path) => path === '/api/admin/upload/course-videos', maxBytes: 1025 * MB },
  { matches: (path) => path === '/api/lia/dictation', maxBytes: 26 * MB },
  { matches: (path) => path === '/api/upload', maxBytes: 13 * MB },
  { matches: (path) => path.endsWith('/business/users/import'), maxBytes: 11 * MB },
  { matches: (path) => path.endsWith('/business/users/upload-picture'), maxBytes: 11 * MB },
  { matches: (path) => path === '/api/profile/upload-picture', maxBytes: 3 * MB },
  { matches: (path) => path === '/api/admin/upload/course-materials', maxBytes: 11 * MB },
  { matches: (path) => path === '/api/admin/upload/organization-image', maxBytes: 11 * MB },
  { matches: (path) => path === '/api/admin/upload/community-image', maxBytes: 6 * MB },
  { matches: (path) => path === '/api/admin/upload/skill-icon', maxBytes: 6 * MB },
]

export function isBodySizeGuardedPath(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

export function resolveRequestBodyLimitBytes(pathname: string): number {
  return MULTIPART_ROUTE_LIMITS.find(({ matches }) => matches(pathname))?.maxBytes
    ?? JSON_BODY_LIMIT_BYTES
}

export function parseContentLength(value: string | null): number | null {
  if (!value) return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return Math.floor(parsed)
}

export function rejectOversizedRequest(
  request: NextRequest,
  explicitLimitBytes?: number,
): NextResponse | null {
  if (!METHODS_WITH_BODY.has(request.method)) return null
  if (!isBodySizeGuardedPath(request.nextUrl.pathname)) return null

  const limitBytes = explicitLimitBytes
    ?? resolveRequestBodyLimitBytes(request.nextUrl.pathname)
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
