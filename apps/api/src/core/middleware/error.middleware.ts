import type { NextFunction, Request, RequestHandler, Response } from 'express'
import jwt from 'jsonwebtoken'
import { ZodError } from 'zod'

import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  createError,
  fromZodError,
  isJsonSyntaxError,
} from '@/core/errors/app-error'
import { logger } from '@/core/logging/logger'

function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof ZodError) {
    return fromZodError(error)
  }

  if (error instanceof jwt.TokenExpiredError) {
    return new UnauthorizedError('Token expirado', 'TOKEN_EXPIRED')
  }

  if (error instanceof jwt.JsonWebTokenError) {
    return new UnauthorizedError('Token invalido', 'INVALID_TOKEN')
  }

  if (isJsonSyntaxError(error)) {
    return createError('JSON invalido en el cuerpo de la peticion', 400, 'INVALID_JSON')
  }

  if (error instanceof Error) {
    return createError(error.message, 500, 'INTERNAL_ERROR')
  }

  return createError('Error interno del servidor', 500, 'INTERNAL_ERROR')
}

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const normalizedError = normalizeError(error)
  const exposeMessage =
    normalizedError.statusCode < 500 || process.env.NODE_ENV !== 'production'

  logger.error('Unhandled API error', error, {
    method: req.method,
    path: req.originalUrl,
    statusCode: normalizedError.statusCode,
  })

  return res.status(normalizedError.statusCode).json({
    success: false,
    error: {
      message: exposeMessage
        ? normalizedError.message
        : 'Error interno del servidor',
      code: normalizedError.code,
      statusCode: normalizedError.statusCode,
      ...(normalizedError.details ? { details: normalizedError.details } : {}),
      ...(process.env.NODE_ENV !== 'production' && normalizedError.stack
        ? { stack: normalizedError.stack }
        : {}),
    },
  })
}

export const notFoundHandler: RequestHandler = (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.status(404).end()
    return
  }

  const error = new NotFoundError(
    `Ruta ${req.method} ${req.path} no encontrada`,
    'ROUTE_NOT_FOUND',
  )

  res.status(error.statusCode).json({
    success: false,
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    },
  })
}

export function asyncHandler<TRequest extends Request = Request>(
  handler: (
    req: TRequest,
    res: Response,
    next: NextFunction,
  ) => Promise<unknown> | unknown,
) {
  return async (req: TRequest, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
