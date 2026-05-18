import { NextResponse, type NextRequest } from 'next/server'

import {
  RESPONSE_SIZE_HEADER,
  measureResponseSizeBytes,
} from '@/lib/api/response-size'
import { logger } from '@/lib/logger'
import {
  CORRELATION_ID_HEADER,
  getOrCreateCorrelationId,
  setCorrelationId,
} from './correlation'
import { emitApmRequestSpan } from './apm'
import {
  incrementCounter,
  observeDurationMs,
  observeDurationSeconds,
} from './metrics'

type ObservedApiHandler<TContext> = (
  request: NextRequest,
  context: TContext,
) => Promise<Response>

function getPathname(request: NextRequest) {
  return new URL(request.url).pathname
}

function withResponseCorrelationId(response: Response, correlationId: string) {
  try {
    setCorrelationId(response.headers, correlationId)
    return response
  } catch {
    const clonedResponse = new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
    clonedResponse.headers.set(CORRELATION_ID_HEADER, correlationId)
    return clonedResponse
  }
}

function appendServerTiming(current: string | null, durationMs: number): string {
  const nextValue = `app;dur=${durationMs}`
  return current ? `${current}, ${nextValue}` : nextValue
}

function recordRequestMetrics(
  routeName: string,
  method: string,
  statusCode: number,
  durationMs: number,
  responseSizeBytes?: number,
) {
  const labels = {
    route: routeName,
    method,
    status: statusCode,
  }

  incrementCounter('http_requests_total', labels)
  observeDurationMs('http_request_duration_ms', durationMs, labels)
  observeDurationSeconds('http_request_duration_seconds', durationMs / 1000, labels)
  if (responseSizeBytes !== undefined) {
    observeDurationMs('http_response_size_bytes', responseSizeBytes, labels)
  }
}

export function withApiObservability<TContext = Record<string, never>>(
  routeName: string,
  handler: ObservedApiHandler<TContext>,
) {
  return async (request: NextRequest, context: TContext) => {
    const startedAt = performance.now()
    const correlationId = getOrCreateCorrelationId(request.headers)
    const pathname = getPathname(request)

    try {
      const response = await handler(request, context)
      const requestDurationMs = Math.round(performance.now() - startedAt)
      const responseWithCorrelation = withResponseCorrelationId(response, correlationId)
      const responseSizeBytes = await measureResponseSizeBytes(responseWithCorrelation)
      responseWithCorrelation.headers.set('X-Request-Duration-Ms', requestDurationMs.toString())
      if (responseSizeBytes !== null) {
        responseWithCorrelation.headers.set(RESPONSE_SIZE_HEADER, responseSizeBytes.toString())
      }
      responseWithCorrelation.headers.set(
        'Server-Timing',
        appendServerTiming(responseWithCorrelation.headers.get('Server-Timing'), requestDurationMs),
      )
      recordRequestMetrics(
        routeName,
        request.method,
        responseWithCorrelation.status,
        requestDurationMs,
        responseSizeBytes ?? undefined,
      )
      emitApmRequestSpan({
        correlationId,
        durationMs: requestDurationMs,
        method: request.method,
        path: pathname,
        routeName,
        statusCode: responseWithCorrelation.status,
      })

      logger.info('api.request.completed', {
        correlationId,
        method: request.method,
        path: pathname,
        routeName,
        statusCode: responseWithCorrelation.status,
        request_duration_ms: requestDurationMs,
        response_size_bytes: responseSizeBytes ?? undefined,
      })

      return responseWithCorrelation
    } catch (error) {
      const requestDurationMs = Math.round(performance.now() - startedAt)
      recordRequestMetrics(routeName, request.method, 500, requestDurationMs)
      emitApmRequestSpan({
        correlationId,
        durationMs: requestDurationMs,
        method: request.method,
        path: pathname,
        routeName,
        statusCode: 500,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      })
      logger.error('api.request.failed', error, {
        correlationId,
        method: request.method,
        path: pathname,
        routeName,
        request_duration_ms: requestDurationMs,
      })

      throw error
    }
  }
}
