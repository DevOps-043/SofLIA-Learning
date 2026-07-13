import { NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { getCompanyCoursesSection } from '@/features/admin/services/admin-companies/company-courses-section.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { apiError } from '@/lib/api/errors'
import { logger } from '@/lib/utils/logger'

const paramsSchema = z.object({
  id: z.string().uuid('OrganizationId invalido'),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Bootstrap agregado de la pestaña Cursos del editor de empresa.
 * Sustituye 9 GETs paralelos del cliente por una sola invocación que comparte
 * contexto entre secciones (ver company-courses-section.service.ts).
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const { id: organizationId } = paramsSchema.parse(await params)
    const data = await getCompanyCoursesSection(organizationId)

    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', error.errors[0]?.message || 'OrganizationId invalido', 400)
    }

    logger.error('Error fetching company courses section:', error)
    return apiError(
      'ADMIN_COMPANY_COURSES_SECTION_FAILED',
      'Error al cargar la información de cursos de la empresa',
      500,
    )
  }
}
