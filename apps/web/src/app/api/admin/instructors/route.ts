import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { withCacheHeaders, cacheHeaders } from '@/lib/utils/cache-headers'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()

    // OPTIMIZADO: Una sola consulta en lugar de dos
    // Antes: 2 queries secuenciales (allUsers + instructors)
    // Ahora: 1 query con filtro ilike case-insensitive y límite
    const [
      { data: { user: currentUser } },
      { data: instructors, error }
    ] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from('users')
        .select('id, display_name, first_name, last_name, username, platform_role')
        .or('platform_role.ilike.instructor,platform_role.ilike.administrador')
        .order('platform_role', { ascending: true })
        .order('display_name', { ascending: true })
        .limit(100) // Límite explícito para escala
    ])

    if (error) {
      logger.error('Error fetching instructors:', error)
      return NextResponse.json(
        { error: 'Error al obtener instructores', details: error.message },
        { status: 500 }
      )
    }

    // Si hay un usuario autenticado y es instructor/administrador, ponerlo primero
    let sortedInstructors = instructors || []

    if (currentUser) {
      const currentUserIndex = sortedInstructors.findIndex(u => u.id === currentUser.id)

      if (currentUserIndex > -1) {
        // Mover el usuario actual al inicio
        const [currentUserData] = sortedInstructors.splice(currentUserIndex, 1)
        sortedInstructors = [currentUserData, ...sortedInstructors]
      }
    }

    const formattedInstructors = sortedInstructors.map(user => ({
      id: user.id,
      name: user.display_name ||
            `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
            user.username ||
            'Usuario sin nombre'
    }))

    // Agregar cache headers para reducir llamadas repetidas
    return withCacheHeaders(
      NextResponse.json({
        success: true,
        instructors: formattedInstructors,
        total: formattedInstructors.length
      }),
      cacheHeaders.semiStatic // Cache 5 minutos - lista de instructores cambia poco
    )
  } catch (error) {
    logger.error('Error in GET /api/admin/instructors:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener instructores'
      },
      { status: 500 }
    )
  }
}

