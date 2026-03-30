import { NextRequest, NextResponse } from 'next/server'
import { InstructorWorkshopsService } from '@/features/instructor/services/instructorWorkshops.service'
import { SessionService } from '@/features/auth/services/session.service'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: 'No autorizado. Solo instructores pueden editar talleres' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Actualizar el taller
    const workshop = await InstructorWorkshopsService.updateWorkshop(id, currentUser.id, body)

    return NextResponse.json(workshop)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar el taller' },
      { status: 500 }
    )
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const workshop = await InstructorWorkshopsService.getWorkshopById(id)
    if (!workshop) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }
    return NextResponse.json({ success: true, workshop })
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener el taller' }, { status: 500 })
  }
}

