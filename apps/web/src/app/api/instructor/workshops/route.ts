import { NextRequest, NextResponse } from 'next/server'
import { InstructorWorkshopsService } from '@/features/instructor/services/instructorWorkshops.service'
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

    // Obtener talleres del instructor usando su ID
    const workshops = await InstructorWorkshopsService.getInstructorWorkshops(currentUser.id)

    return NextResponse.json(workshops)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener talleres del instructor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
        { error: 'No autorizado. Solo instructores pueden crear talleres' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Crear el taller
    const workshop = await InstructorWorkshopsService.createWorkshop(currentUser.id, body)

    return NextResponse.json(workshop, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear el taller' },
      { status: 500 }
    )
  }
}
