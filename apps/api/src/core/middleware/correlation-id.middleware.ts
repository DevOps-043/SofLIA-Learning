import { AsyncLocalStorage } from 'async_hooks'
import type { NextFunction, Request, Response } from 'express'
import { randomUUID } from 'crypto'

const CORRELATION_HEADER = 'x-correlation-id'
const REQUEST_ID_HEADER = 'x-request-id'

interface RequestContext {
  correlationId: string
  requestId: string
  startTime: number
}

// Propagates correlation context across the async call chain without parameter drilling
export const requestContextStorage = new AsyncLocalStorage<RequestContext>()

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId =
    (req.headers[CORRELATION_HEADER] as string | undefined) ?? randomUUID()
  const requestId = randomUUID()
  const startTime = Date.now()

  res.setHeader(CORRELATION_HEADER, correlationId)
  res.setHeader(REQUEST_ID_HEADER, requestId)

  const context: RequestContext = { correlationId, requestId, startTime }
  requestContextStorage.run(context, next)
}

export function getCorrelationId(): string | undefined {
  return requestContextStorage.getStore()?.correlationId
}

export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore()
}
