import { NextResponse } from 'next/server'
import { InstructorStatsServerService } from '@/features/instructor/services/instructorStats.server.service'
import { SessionService } from '@/features/auth/services/session.service'

export async function GET() {
  try {
    // Obtener el usuario actual usando el sistema de sesiones personalizado
    const currentUser = await SessionService.getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar que el usuario sea instructor o administrador
    const userRole = currentUser.cargo_rol?.toLowerCase().trim()
    if (userRole !== 'instructor' && userRole !== 'administrador') {
      return NextResponse.json(
        { error: 'No autorizado. Solo instructores pueden acceder a esta información' },
        { status: 403 }
      )
    }

    // Obtener estadísticas del instructor usando su ID como instructor_id
    const stats = await InstructorStatsServerService.getInstructorStats(currentUser.id)

    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener estadísticas del instructor' },
      { status: 500 }
    )
  }
}

