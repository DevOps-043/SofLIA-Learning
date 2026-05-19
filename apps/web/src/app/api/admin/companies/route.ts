import { NextRequest, NextResponse } from 'next/server'

import { AdminCompaniesService } from '@/features/admin/services/adminCompanies.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'

import {
  createCompanySchema,
  type CreateCompanyBody,
} from './schema'

export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const companies = await AdminCompaniesService.getCompanies()
    const stats = AdminCompaniesService.calculateStats(companies)
    return NextResponse.json({ success: true, companies, stats })
  } catch (error) {
    logger.error('Error in GET /api/admin/companies', error)
    return apiError(
      'LIST_COMPANIES_FAILED',
      'Error al obtener empresas',
      500,
    )
  }
}

async function handlePost(_request: NextRequest, body: CreateCompanyBody) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const company = await AdminCompaniesService.createCompany(body)
    return NextResponse.json({ success: true, company })
  } catch (error) {
    logger.error('Error in POST /api/admin/companies', error)
    return apiError('CREATE_COMPANY_FAILED', 'Error al crear organización', 500)
  }
}

export const POST = withZodBody(createCompanySchema, handlePost)
