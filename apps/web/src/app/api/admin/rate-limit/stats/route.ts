import { NextRequest, NextResponse } from 'next/server';
import { getRateLimitStats, clearAllRateLimits } from '@/core/lib/rate-limit';

/**
 * GET /api/admin/rate-limit/stats
 * Obtiene estadísticas de rate limiting
 * Solo accesible para administradores
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Verificar que sea admin
    const sessionCookie = request.cookies.get('aprende-y-aplica-session');
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const stats = getRateLimitStats();
    
    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Error obteniendo estadísticas'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/rate-limit/stats
 * Limpia todos los rate limits (solo para testing)
 * Solo disponible en desarrollo
 */
export async function DELETE(request: NextRequest) {
  // Solo permitir en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, error: 'Solo disponible en desarrollo' },
      { status: 403 }
    );
  }

  try {
    clearAllRateLimits();
    
    return NextResponse.json({
      success: true,
      message: 'Todos los rate limits han sido limpiados',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Error limpiando rate limits'
      },
      { status: 500 }
    );
  }
}
