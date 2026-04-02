import type { NextFunction, Request, Response } from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'

import { UnauthorizedError, createError } from '@/core/errors/app-error'
import { config } from '@/config/env'

interface RawAuthMetadata {
  organization_id?: string
  organization_slug?: string
  org_slug?: string
  orgSlug?: string
  role?: string
}

interface RawSupabaseJwtPayload extends JwtPayload {
  sub?: string
  email?: string
  role?: string
  app_metadata?: RawAuthMetadata
  user_metadata?: RawAuthMetadata
  organization_id?: string
  organization_slug?: string
  org_slug?: string
  orgSlug?: string
}

export interface AuthenticatedRequestUser {
  id: string
  email: string
  role: string
  organizationId?: string
  organizationSlug?: string
}

function extractClaimString(...values: Array<string | undefined>) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)
}

function buildAuthenticatedUser(
  payload: RawSupabaseJwtPayload,
): AuthenticatedRequestUser | null {
  const appMetadata = payload.app_metadata ?? {}
  const userMetadata = payload.user_metadata ?? {}

  const id = extractClaimString(payload.sub)
  const email = extractClaimString(payload.email)
  const role = extractClaimString(
    appMetadata.role,
    userMetadata.role,
    payload.role,
  )
  const organizationId = extractClaimString(
    appMetadata.organization_id,
    userMetadata.organization_id,
    payload.organization_id,
  )
  const organizationSlug = extractClaimString(
    appMetadata.organization_slug,
    appMetadata.org_slug,
    appMetadata.orgSlug,
    userMetadata.organization_slug,
    userMetadata.org_slug,
    userMetadata.orgSlug,
    payload.organization_slug,
    payload.org_slug,
    payload.orgSlug,
  )

  if (!id || !email || !role) {
    return null
  }

  return {
    id,
    email,
    role,
    ...(organizationId ? { organizationId } : {}),
    ...(organizationSlug ? { organizationSlug } : {}),
  }
}

function verifyAccessToken(token: string) {
  return jwt.verify(token, config.SUPABASE_JWT_SECRET || config.JWT_SECRET)
}

function authenticateInternal(
  req: Request,
  next: NextFunction,
  options: { optional?: boolean } = {},
) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : undefined

  if (!token) {
    if (options.optional) {
      next()
      return
    }

    next(new UnauthorizedError('Token de acceso requerido', 'MISSING_TOKEN'))
    return
  }

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
    if (options.optional) {
      next()
      return
    }

    if (error instanceof jwt.TokenExpiredError) {
      next(createError('Token expirado', 401, 'TOKEN_EXPIRED'))
      return
    }

    if (error instanceof jwt.JsonWebTokenError) {
      next(createError('Token invalido', 401, 'INVALID_TOKEN'))
      return
    }

    next(error)
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  authenticateInternal(req, next)
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  authenticateInternal(req, next, { optional: true })
}
