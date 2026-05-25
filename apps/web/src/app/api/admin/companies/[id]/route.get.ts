import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth/requireAdmin'

import { logger } from '@/lib/utils/logger'

import { AdminCompaniesService, CompanyUpdatePayload } from '@/features/admin/services/adminCompanies.service'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET - Obtener empresa por ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { id: companyId } = await params

  if (!companyId) {
    return NextResponse.json(
      { success: false, error: 'ID de empresa inválido' },
      { status: 400 }
    )
  }

  try {
    const company = await AdminCompaniesService.getCompanyById(companyId)

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Empresa no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      company
    })
  } catch (error) {
    logger.error(`💥 Error fetching company ${companyId}:`, error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener la empresa' },
      { status: 500 }
    )
  }
}
