import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../lib/logger';
import { ProfileServerService } from '../../../features/profile/services/profile-server.service'
import { SessionService } from '../../../features/auth/services/session.service'

export async function GET(request: NextRequest) {
  try {
    // Usar SessionService para obtener el usuario actual (sistema de autenticación personalizado)
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await ProfileServerService.getProfile(user.id)
    return NextResponse.json(profile)
  } catch (error) {
    console.error('API /profile GET Error:', error);
    logger.error('Error in profile GET API:', error)
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Usar SessionService para obtener el usuario actual (sistema de autenticación personalizado)
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await request.json()
    const updatedProfile = await ProfileServerService.updateProfile(user.id, updates)
    
    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('API /profile PUT Error:', error);
    logger.error('Error in profile PUT API:', error)
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
