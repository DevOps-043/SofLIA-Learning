import { NextRequest, NextResponse } from 'next/server'

import { AdminCompaniesService } from '@/features/admin/services/adminCompanies.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'

import { deleteCompanySchema, type DeleteCompanyBody } from '../schema'

type RouteContext = { params: Promise<{ id: string }> }

async function handleDelete(
  _request: NextRequest,
  body: DeleteCompanyBody,
  context: RouteContext,
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { id: companyId } = await context.params
  if (!companyId) {
    return apiError('COMPANY_ID_INVALID', 'ID de empresa inválido', 400)
  }

  const company = await AdminCompaniesService.getCompanyById(companyId)
  if (!company) {
    return apiError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404)
  }

  if (body.confirmName.trim() !== company.name.trim()) {
    return apiError(
      'CONFIRMATION_MISMATCH',
      'El nombre ingresado no coincide con el de la organización',
      400,
    )
  }

  try {
    await AdminCompaniesService.deleteCompany(companyId, auth.userId)
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error(`Error deleting company ${companyId}`, error)
    return apiError('DELETE_COMPANY_FAILED', 'Error al eliminar la empresa', 500)
  }
}

export const DELETE = withZodBody(deleteCompanySchema, handleDelete)
