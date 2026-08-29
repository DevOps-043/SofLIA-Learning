import { NextRequest, NextResponse } from 'next/server'

import { ProfileServerService } from '@/features/profile/services/profile-server.service'
import { requireUser } from '@/lib/auth/requireUser'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { logger } from '@/lib/logger'

import { updateProfileSchema, type UpdateProfileBody } from './schema'

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-correlation-id') || crypto.randomUUID()

  try {
    const auth = await requireUser()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('org') || null
    const includeStats = searchParams.get('includeStats') === '1'

    if (includeStats) {
      const [profile, stats, subscriptions] = await Promise.all([
        ProfileServerService.getProfile(auth.userId, organizationId),
        ProfileServerService.getUserStats(auth.userId, organizationId),
        ProfileServerService.getUserSubscriptions(auth.userId),
      ])

      return NextResponse.json({
        profile,
        stats: {
          ...stats,
          subscriptions,
        },
      })
    }

    const profile = await ProfileServerService.getProfile(auth.userId, organizationId)
    return NextResponse.json(profile)
  } catch (error) {
    logger.error('Error in profile GET API', error, { requestId })
    return apiError('INTERNAL_SERVER_ERROR', 'Internal Server Error', 500, {
      requestId,
    })
  }
}

async function handlePut(request: NextRequest, body: UpdateProfileBody) {
  const requestId = request.headers.get('x-correlation-id') || crypto.randomUUID()

  try {
    const auth = await requireUser()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('org') || null

    const updatedProfile = await ProfileServerService.updateProfile(
      auth.userId,
      body,
      organizationId,
    )
    return NextResponse.json(updatedProfile)
  } catch (error) {
    logger.error('Error in profile PUT API', error, { requestId })
    return apiError(
      'UPDATE_PROFILE_FAILED',
      'Error al actualizar perfil',
      500,
      { requestId },
    )
  }
}

export const PUT = withZodBody(updateProfileSchema, handlePut)
