import { NextRequest, NextResponse } from 'next/server'

import { AdminModulesService, UpdateModuleData } from '@/features/admin/services/adminModules.service'

import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string }> }
) {
  try {
    const { moduleId } = await params
    const body = await request.json() as UpdateModuleData

    if (!moduleId) {
      return NextResponse.json(
        { error: 'Module ID es requerido' },
        { status: 400 }
      )
    }

    const module = await AdminModulesService.updateModule(moduleId, body)

    return NextResponse.json({
      success: true,
      module
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al actualizar módulo' 
      },
      { status: 500 }
    )
  }
}
