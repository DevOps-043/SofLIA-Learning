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
