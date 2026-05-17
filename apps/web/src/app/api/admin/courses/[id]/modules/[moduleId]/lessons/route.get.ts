import { NextRequest, NextResponse } from 'next/server'

import { AdminLessonsService, CreateLessonData } from '@/features/admin/services/adminLessons.service'

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

    const lessons = await AdminLessonsService.getModuleLessons(moduleId)

    return NextResponse.json({
      success: true,
      lessons
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener lecciones' 
      },
      { status: 500 }
    )
  }
}
