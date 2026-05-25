import { NextRequest, NextResponse } from 'next/server'

import { AdminModulesService, UpdateModuleData } from '@/features/admin/services/adminModules.service'

import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { moduleId } = await params

    if (!moduleId) {
      return NextResponse.json(
        { error: 'Module ID es requerido' },
        { status: 400 }
      )
    }

    const module = await AdminModulesService.getModuleById(moduleId)

    if (!module) {
      return NextResponse.json(
        { error: 'Módulo no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      module
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener módulo' 
      },
      { status: 500 }
    )
  }
}
