import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

import { UnauthorizedError, createError } from '@/core/errors/app-error'

import { buildAuthenticatedUser, verifyAccessToken } from './auth.claims'
import type { RawSupabaseJwtPayload } from './auth.types'

function readBearerToken(req: Request) {
  const authHeader = req.headers.authorization

  return authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : undefined
}

function handleMissingToken(next: NextFunction, optional?: boolean) {
  if (optional) {
    next()
    return
  }

  next(new UnauthorizedError('Token de acceso requerido', 'MISSING_TOKEN'))
}

function authenticateInternal(
  req: Request,
  next: NextFunction,
  options: { optional?: boolean } = {},
) {
  const token = readBearerToken(req)
  if (!token) return handleMissingToken(next, options.optional)

  try {
    const decoded = verifyAccessToken(token)
    const payload =
      decoded && typeof decoded === 'object'
        ? buildAuthenticatedUser(decoded as RawSupabaseJwtPayload)
        : null

    if (!payload) {
      next(createError('Token invalido', 401, 'INVALID_TOKEN'))
      return
    }

    req.user = payload
    next()
  } catch (error) {
    handleAuthError(error, next, options.optional)
  }
}

function handleAuthError(
  error: unknown,
  next: NextFunction,
  optional?: boolean,
) {
  if (optional) return next()

  if (error instanceof jwt.TokenExpiredError) {
    return next(createError('Token expirado', 401, 'TOKEN_EXPIRED'))
  }

  if (error instanceof jwt.JsonWebTokenError) {
    return next(createError('Token invalido', 401, 'INVALID_TOKEN'))
  }

  next(error)
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  authenticateInternal(req, next)
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  authenticateInternal(req, next, { optional: true })
}

export type { AuthenticatedRequestUser } from './auth.types'
