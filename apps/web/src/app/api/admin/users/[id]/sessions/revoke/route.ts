import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { apiError } from '@/lib/api/errors'
import { RefreshTokenService } from '@/lib/auth/refreshToken.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/logger'
import { revokeSupabaseAuthSessions } from '@/features/auth/services/supabase-auth-bridge.service'

type RevokeSessionsContext = {
  params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, context: RevokeSessionsContext) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) {
    return auth
  }

  const { id: targetUserId } = await context.params

  if (!targetUserId) {
    return apiError('MISSING_USER_ID', 'User id is required.', 400)
  }

  try {
    await RefreshTokenService.revokeAllUserTokens(
      targetUserId,
      `admin_revoked_by:${auth.userId}`,
    )
    const nativeSessionsRevoked = await revokeSupabaseAuthSessions(targetUserId)

    logger.warn('security.admin_revoked_user_sessions', {
      actorUserId: auth.userId,
      nativeSessionsRevoked,
      targetUserId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('security.admin_revoke_user_sessions_failed', {
      error: error instanceof Error ? error.message : 'unknown',
      targetUserId,
    })
    return apiError('SESSION_REVOKE_FAILED', 'Could not revoke user sessions.', 500)
  }
}
