import { NextRequest, NextResponse } from 'next/server'
import { parseReportFilters, parseReportType } from '../../../../../features/business-panel/services/report-data.filters'
import { generateBusinessReportData } from '../../../../../features/business-panel/services/report-data.service'
import { requireBusiness } from '../../../../../lib/auth/requireBusiness'
import { createClient } from '../../../../../lib/supabase/server'
import { logger } from '../../../../../lib/utils/logger'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) {
      return auth
    }

    if (!auth.organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes una organización asignada',
        },
        { status: 403 },
      )
    }

    const { searchParams } = new URL(request.url)
    const reportType = parseReportType(searchParams.get('type'))

    if (!reportType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tipo de reporte no válido',
        },
        { status: 400 },
      )
    }

    const filters = parseReportFilters(searchParams, reportType)
    const supabase = await createClient()
    const reportData = await generateBusinessReportData(supabase, auth.organizationId, filters)

    return NextResponse.json({
      success: true,
      report_type: reportType,
      filters,
      data: reportData,
      generated_at: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Error in /api/business/reports/data:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al generar el reporte',
      },
      { status: 500 },
    )
  }
}
