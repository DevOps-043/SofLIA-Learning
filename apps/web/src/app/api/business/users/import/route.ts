import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'
import { importBusinessUsersFromCsv } from './import.service'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organizaciÃ³n asignada' },
        { status: 403 },
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionÃ³ ningÃºn archivo' },
        { status: 400 },
      )
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { success: false, error: 'El archivo debe ser un CSV (.csv)' },
        { status: 400 },
      )
    }

    const importResult = await importBusinessUsersFromCsv({
      fileContent: await file.text(),
      organizationId: auth.organizationId,
      createdBy: auth.userId,
    })

    if (!importResult.success) {
      return NextResponse.json(
        { success: false, error: importResult.error },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      result: {
        imported: importResult.result.success,
        errors: importResult.result.errors.length,
        total: importResult.result.total,
        details: importResult.result.errors,
      },
    })
  } catch (error) {
    logger.error('Error in /api/business/users/import:', error)
    return NextResponse.json(
      { success: false, error: 'Error al importar usuarios' },
      { status: 500 },
    )
  }
}
