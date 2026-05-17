import { NextRequest, NextResponse } from 'next/server'

import { AdminModulesService, UpdateModuleData } from '@/features/admin/services/adminModules.service'

import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string }> }
) {
  try {
    const { moduleId } = await params

    if (!moduleId) {
      return NextResponse.json(
        { error: 'Module ID es requerido' },
        { status: 400 }
      )
    }

    await AdminModulesService.deleteModule(moduleId)

    return NextResponse.json({
      success: true,
      message: 'Módulo eliminado correctamente'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al eliminar módulo' 
      },
      { status: 500 }
    )
  }
}
