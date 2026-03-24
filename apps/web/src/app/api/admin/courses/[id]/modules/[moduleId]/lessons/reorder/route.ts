import { NextRequest, NextResponse } from 'next/server'
import { AdminLessonsService } from '@/features/admin/services/adminLessons.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { moduleId } = await params
    const { lessons } = await request.json()

    if (!moduleId) {
      return NextResponse.json(
        { error: 'Module ID es requerido' },
        { status: 400 }
      )
    }

    if (!lessons || !Array.isArray(lessons)) {
      return NextResponse.json(
        { error: 'La lista de lecciones es requerida y debe ser un array' },
        { status: 400 }
      )
    }

    await AdminLessonsService.reorderLessons(moduleId, lessons)

    return NextResponse.json({
      success: true,
      message: 'Lecciones reordenadas correctamente'
    })
  } catch (error) {
    console.error('Error in POST /api/admin/courses/[id]/modules/[moduleId]/lessons/reorder:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Error al reordenar lecciones' 
      },
      { status: 500 }
    )
  }
}
