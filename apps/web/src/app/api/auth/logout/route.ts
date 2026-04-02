import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { SessionService } from '../../../../features/auth/services/session.service'
import { applyAuthRateLimit } from '@/lib/auth/auth-rate-limit'

export async function POST(request: Request) {
  try {
    const rateLimitResponse = applyAuthRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    logger.log('🚪 API Logout: Iniciando...')
    
    // Destruir la sesión usando SessionService
    await SessionService.destroySession()
    
    logger.log('✅ API Logout: Sesión destruida exitosamente')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Sesión cerrada exitosamente' 
    })
  } catch (error) {
    logger.error('💥 API Logout Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error al cerrar sesión' 
    }, { status: 500 })
  }
}
