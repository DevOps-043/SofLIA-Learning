import { NextRequest, NextResponse } from 'next/server'
import { AdminLessonsService, UpdateLessonData } from '@/features/admin/services/adminLessons.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string, lessonId: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { lessonId } = await params

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID es requerido' },
        { status: 400 }
      )
    }

    const lesson = await AdminLessonsService.getLessonById(lessonId)

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lección no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      lesson
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener lección' 
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string, lessonId: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { lessonId } = await params
    const body = await request.json() as UpdateLessonData

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID es requerido' },
        { status: 400 }
      )
    }

    const lesson = await AdminLessonsService.updateLesson(lessonId, body)

    return NextResponse.json({
      success: true,
      lesson
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al actualizar lección' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string, lessonId: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { lessonId } = await params

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID es requerido' },
        { status: 400 }
      )
    }

    await AdminLessonsService.deleteLesson(lessonId)

    return NextResponse.json({
      success: true,
      message: 'Lección eliminada correctamente'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al eliminar lección' 
      },
      { status: 500 }
    )
  }
}

