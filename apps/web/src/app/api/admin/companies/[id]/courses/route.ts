import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { AdminCompaniesService } from '@/features/admin/services/adminCompanies.service'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET - Obtener cursos asignados a la empresa
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { id: companyId } = await params

  try {
    const courses = await AdminCompaniesService.getCompanyCourses(companyId)
    return NextResponse.json({
      success: true,
      courses
    })
  } catch (error) {
    logger.error(`💥 Error fetching courses for company ${companyId}:`, error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener los cursos de la empresa' },
      { status: 500 }
    )
  }
}

// POST - Asignar un curso a la empresa
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { id: companyId } = await params
  
  try {
    const { courseId } = await request.json()
    
    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'ID de curso requerido' },
        { status: 400 }
      )
    }

    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const assignment = await AdminCompaniesService.assignCourseToCompany(companyId, courseId, auth.userId)

    return NextResponse.json({
      success: true,
      assignment
    })
  } catch (error) {
    logger.error(`💥 Error assigning course to company ${companyId}:`, error)
    return NextResponse.json(
      { success: false, error: 'Error al asignar el curso' },
      { status: 500 }
    )
  }
}

// DELETE - Remover asignación de curso (usando query param ?courseId=...)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { id: companyId } = await params
  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('courseId')

  if (!courseId) {
    return NextResponse.json(
      { success: false, error: 'ID de curso requerido en los parámetros de búsqueda' },
      { status: 400 }
    )
  }

  try {
    await AdminCompaniesService.removeCourseFromCompany(companyId, courseId)
    return NextResponse.json({
      success: true,
      message: 'Asignación de curso eliminada con éxito'
    })
  } catch (error) {
    logger.error(`💥 Error removing course from company ${companyId}:`, error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar la asignación del curso' },
      { status: 500 }
    )
  }
}
