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
