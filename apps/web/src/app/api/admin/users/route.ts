import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { AdminUsersService } from '@/features/admin/services/adminUsers.service'
import {
  ADMIN_USERS_DEFAULT_PAGE_SIZE,
  isAdminUserPlatformRole,
} from '@/features/admin/services/admin-users'
import { requireAdmin } from '@/lib/auth/requireAdmin'

/** `parseInt` devuelve NaN ante basura; aqui se cae al valor por defecto. */
function parsePositiveInt(rawValue: string | null, fallback: number): number {
  const parsed = Number.parseInt(rawValue ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export async function GET(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    // 🚀 OPTIMIZACIÓN: Soporte para paginación
    const searchParams = request.nextUrl.searchParams
    const page = parsePositiveInt(searchParams.get('page'), 1)
    const limit = parsePositiveInt(searchParams.get('limit'), ADMIN_USERS_DEFAULT_PAGE_SIZE)
    const search = searchParams.get('search') || undefined
    const organizationId = searchParams.get('organizationId') || undefined
    const courseId = searchParams.get('courseId') || undefined
    const learningPathId = searchParams.get('learningPathId') || undefined

    // Un rol desconocido se rechaza en vez de ignorarse: devolver el directorio
    // completo cuando se pidio filtrarlo seria un resultado silenciosamente falso.
    const roleParam = searchParams.get('role')
    if (roleParam !== null && !isAdminUserPlatformRole(roleParam)) {
      return NextResponse.json(
        { success: false, error: 'Rol de plataforma no valido', users: [], total: 0 },
        { status: 400 },
      )
    }
    const platformRole = roleParam ?? undefined

    // El termino de busqueda puede contener el correo de un usuario: se registra
    // solo si venia informado, nunca su contenido.
    logger.log('🔄 Cargando usuarios desde API...', {
      page,
      limit,
      hasSearch: Boolean(search),
      platformRole,
      organizationId,
      courseId,
      learningPathId,
    })

    const [result, stats] = await Promise.all([
      AdminUsersService.getUsers({
        page,
        limit,
        search,
        platformRole,
        organizationId,
        courseId,
        learningPathId,
      }),
      AdminUsersService.getUserStats()
    ])

    logger.log('✅ Usuarios cargados:', result.users?.length || 0, 'de', result.total)

    return NextResponse.json({
      success: true,
      users: result.users || [],
      total: result.total || 0,
      page: result.page || 1,
      totalPages: result.totalPages || 1,
      stats: stats || {}
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60'
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/admin/users:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener usuarios',
        details: error instanceof Error ? error.message : 'Error desconocido',
        users: [],
        total: 0
      },
      { status: 500 }
    )
  }
}
