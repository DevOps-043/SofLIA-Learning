import jwt from 'jsonwebtoken'

import { config } from '@/config/env'

import type {
  AuthenticatedRequestUser,
  RawSupabaseJwtPayload,
} from './auth.types'

function extractClaimString(...values: Array<string | undefined>) {
  return values.find(
    (value) => typeof value === 'string' && value.trim().length > 0,
  )
}

export function buildAuthenticatedUser(
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

export function verifyAccessToken(token: string) {
  return jwt.verify(token, config.SUPABASE_JWT_SECRET || config.JWT_SECRET)
}
