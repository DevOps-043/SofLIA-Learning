import { NextRequest, NextResponse } from 'next/server'

import { SessionService } from '@/features/auth/services/session.service'
import { ProfileServerService } from '@/features/profile/services/profile-server.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { logger } from '@/lib/logger'

import { updateProfileSchema, type UpdateProfileBody } from './schema'

export async function GET(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('org') || null
    const includeStats = searchParams.get('includeStats') === '1'

    if (includeStats) {
      const [profile, stats, subscriptions] = await Promise.all([
        ProfileServerService.getProfile(user.id, organizationId),
        ProfileServerService.getUserStats(user.id, organizationId),
        ProfileServerService.getUserSubscriptions(user.id),
      ])

      return NextResponse.json({
        profile,
        stats: {
          ...stats,
          subscriptions,
        },
      })
    }

    const profile = await ProfileServerService.getProfile(user.id, organizationId)
    return NextResponse.json(profile)
  } catch (error) {
    logger.error('Error in profile GET API:', error)
    return apiError('INTERNAL_SERVER_ERROR', 'Internal Server Error', 500)
  }
}

async function handlePut(request: NextRequest, body: UpdateProfileBody) {
  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('org') || null

    const updatedProfile = await ProfileServerService.updateProfile(
      user.id,
      body,
      organizationId,
    )
    return NextResponse.json(updatedProfile)
  } catch (error) {
    logger.error('Error in profile PUT API:', error)
    return apiError(
      'UPDATE_PROFILE_FAILED',
      'Error al actualizar perfil',
      500,
    )
  }
}

export const PUT = withZodBody(updateProfileSchema, handlePut)
