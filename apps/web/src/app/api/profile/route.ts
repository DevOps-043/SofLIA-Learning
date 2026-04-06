import { NextRequest, NextResponse } from 'next/server'
import { logger } from '../../../lib/logger'
import { ProfileServerService } from '../../../features/profile/services/profile-server.service'
import { SessionService } from '../../../features/auth/services/session.service'

export async function GET(_request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await ProfileServerService.getProfile(user.id)
    return NextResponse.json(profile)
  } catch (error) {
    logger.error('Error in profile GET API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await request.json()
    const updatedProfile = await ProfileServerService.updateProfile(user.id, updates)

    return NextResponse.json(updatedProfile)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    logger.error('Error in profile PUT API:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
