import { NextRequest, NextResponse } from 'next/server'

import { SessionService } from '@/features/auth/services/session.service'
import { revokeSupabaseAuthSessions } from '@/features/auth/services/supabase-auth-bridge.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { recordSecurityEvent } from '@/lib/security/security-events'
import { createAdminClient } from '@/lib/supabase/admin'

import { deleteAccountSchema, type DeleteAccountBody } from './schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function handlePost(request: NextRequest, body: DeleteAccountBody) {
  const user = await SessionService.getCurrentUser()
  if (!user) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }

  const confirmation = body.confirmation.trim().toLowerCase()
  const expectedValues = [user.email, user.username, 'delete']
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase())

  if (!expectedValues.includes(confirmation)) {
    recordSecurityEvent('privacy-deletion-requested', {
      actorId: user.id,
      actorRole: user.platform_role,
      result: 'denied',
      metadata: { reason: 'confirmation_mismatch' },
    })
    return apiError('CONFIRMATION_MISMATCH', 'La confirmación no coincide', 400)
  }

  const supabase = createAdminClient()
  const { data: existingRequest, error: existingError } = await supabase
    .from('privacy_deletion_requests')
    .select('id, scheduled_deletion_at, status')
    .eq('subject_user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existingError) {
    return apiError(
      'DELETION_VALIDATION_FAILED',
      'No se pudo validar la solicitud',
      500,
    )
  }

  if (existingRequest) {
    return buildDeletionResponse(existingRequest.scheduled_deletion_at, request)
  }

  const { data: deletionRequest, error } = await supabase
    .from('privacy_deletion_requests')
    .insert({
      subject_user_id: user.id,
      user_id: user.id,
      requester_ip: getClientIp(request),
      user_agent: request.headers.get('user-agent'),
      metadata: { reasonProvided: Boolean(body.reason) },
    })
    .select('scheduled_deletion_at')
    .single()

  if (error || !deletionRequest) {
    return apiError(
      'DELETION_CREATE_FAILED',
      'No se pudo crear la solicitud',
      500,
    )
  }

  await revokeUserSessions(user.id)
  recordSecurityEvent('privacy-deletion-requested', {
    actorId: user.id,
    actorRole: user.platform_role,
    resourceType: 'user',
    resourceId: user.id,
  })

  return buildDeletionResponse(deletionRequest.scheduled_deletion_at, request)
}

export const POST = withZodBody(deleteAccountSchema, handlePost)

function buildDeletionResponse(scheduledDeletionAt: string, request?: NextRequest) {
  const response = NextResponse.json({
    success: true,
    status: 'pending',
    scheduledDeletionAt,
  })

  for (const cookieName of [
    'aprende-y-aplica-session',
    'access_token',
    'refresh_token',
    ...getSupabaseAuthCookieNames(request),
  ]) {
    response.cookies.set(cookieName, '', {
      httpOnly: true,
      maxAge: 0,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }

  return response
}

async function revokeUserSessions(userId: string) {
  const supabase = createAdminClient()
  const revokedAt = new Date().toISOString()

  await Promise.all([
    supabase
      .from('refresh_tokens')
      .update({
        is_revoked: true,
        revoked_at: revokedAt,
        revoked_reason: 'privacy_deletion_requested',
      })
      .eq('user_id', userId)
      .eq('is_revoked', false),
    supabase
      .from('user_session')
      .update({ revoked: true })
      .eq('user_id', userId)
      .eq('revoked', false),
    revokeSupabaseAuthSessions(userId),
  ])
}

function getSupabaseAuthCookieNames(request?: NextRequest) {
  if (!request) {
    return []
  }

  return request.cookies
    .getAll()
    .map((cookie) => cookie.name)
    .filter((name) => name.startsWith('sb-') && name.includes('auth-token'))
}

function getClientIp(request: NextRequest) {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null
  )
}
