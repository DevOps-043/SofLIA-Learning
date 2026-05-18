import type { NextRequest, NextResponse } from 'next/server'
import {
  incrementCounter,
  observeDurationMs,
  observeDurationSeconds,
} from '../lib/observability/metrics'

export interface ProxyObservabilityContext {
  correlationId: string
  startedAt: number
  route: string
  method: string
  orgId?: string
  userId?: string
}

export function createProxyObservabilityContext(
  request: NextRequest,
): ProxyObservabilityContext {
  const correlationId = resolveCorrelationId(request)
  request.headers.set('x-correlation-id', correlationId)

  return {
    correlationId,
    startedAt: Date.now(),
    route: normalizeRoute(request.nextUrl.pathname),
    method: request.method.toUpperCase(),
    orgId: resolveOrgIdentifier(request.nextUrl.pathname),
    userId: resolveUserIdentifier(request),
  }
}

export function finalizeProxyResponse(
  response: NextResponse,
  context: ProxyObservabilityContext,
): NextResponse {
  const durationMs = Date.now() - context.startedAt
  const status = response.status

  response.headers.set('X-Correlation-Id', context.correlationId)
  response.headers.set('X-Request-Duration-Ms', durationMs.toString())
  response.headers.set('Server-Timing', appendServerTiming(
    response.headers.get('Server-Timing'),
    `app;dur=${durationMs}`,
  ))

  incrementCounter('http_requests_total', {
    route: context.route,
    method: context.method,
    status,
    orgId: context.orgId,
    userId: context.userId,
  })
  observeDurationMs('http_request_duration_ms', durationMs, {
    route: context.route,
    method: context.method,
    status,
    orgId: context.orgId,
    userId: context.userId,
  })
  observeDurationSeconds('http_request_duration_seconds', durationMs / 1000, {
    route: context.route,
    method: context.method,
    status,
    orgId: context.orgId,
    userId: context.userId,
  })

  return response
}

function resolveCorrelationId(request: NextRequest): string {
  const incoming = request.headers.get('x-correlation-id') || request.headers.get('x-request-id')

  if (incoming && /^[a-zA-Z0-9._:-]{8,128}$/.test(incoming)) {
    return incoming
  }

  return globalThis.crypto?.randomUUID?.() ?? fallbackCorrelationId()
}

function fallbackCorrelationId(): string {
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function appendServerTiming(current: string | null, nextValue: string): string {
  return current ? `${current}, ${nextValue}` : nextValue
}

function resolveUserIdentifier(request: NextRequest): string | undefined {
  const sessionCookie = request.cookies.get('aprende-y-aplica-session')?.value
  return sessionCookie ? `session:${stableHash(sessionCookie)}` : undefined
}

function resolveOrgIdentifier(pathname: string): string | undefined {
  const pathSegments = pathname.split('/').filter(Boolean)

  if (pathSegments[0] === 'api' && pathSegments[1] && !isGenericApiSegment(pathSegments[1])) {
    return `slug:${stableHash(pathSegments[1])}`
  }

  if (pathSegments[0] && !isGenericPageSegment(pathSegments[0])) {
    return `slug:${stableHash(pathSegments[0])}`
  }

  return undefined
}

function isGenericApiSegment(segment: string): boolean {
  return [
    'admin',
    'ai-chat',
    'auth',
    'business',
    'business-user',
    'courses',
    'health',
    'lia',
    'observability',
    'performance',
    'study-planner',
  ].includes(segment)
}

function isGenericPageSegment(segment: string): boolean {
  return [
    'admin',
    'auth',
    'business',
    'business-panel',
    'business-user',
    'courses',
    'downloads',
    'login',
    'profile',
    'study-planner',
  ].includes(segment)
}

function stableHash(value: string): string {
  let hash = 5381

  for (let index = 0; index < value.length; index++) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(index)
  }

  return (hash >>> 0).toString(36)
}

function normalizeRoute(pathname: string): string {
  return pathname
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':uuid')
    .replace(/\/[0-9]+(?=\/|$)/g, '/:id')
}
