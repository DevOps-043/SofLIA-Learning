import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { AdminModulesService } from '@/features/admin/services/adminModules.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { id: courseId } = await params
    const { modules } = await request.json()

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID es requerido' },
        { status: 400 }
      )
    }

    if (!modules || !Array.isArray(modules)) {
      return NextResponse.json(
        { error: 'La lista de módulos es requerida y debe ser un array' },
        { status: 400 }
      )
    }

    await AdminModulesService.reorderModules(courseId, modules)

    return NextResponse.json({
      success: true,
      message: 'Módulos reordenados correctamente'
    })
  } catch (error) {
    techDebtLogger.error('Error in POST /api/admin/courses/[id]/modules/reorder:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Error al reordenar módulos' 
      },
      { status: 500 }
    )
  }
}
