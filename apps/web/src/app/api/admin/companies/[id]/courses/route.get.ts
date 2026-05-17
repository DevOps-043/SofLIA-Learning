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
