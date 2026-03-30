import { NextRequest, NextResponse } from 'next/server'
import { AdminLessonsService, CreateLessonData } from '@/features/admin/services/adminLessons.service'
import { requireInstructor } from '@/lib/auth/requireAdmin'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string }> }
) {
  try {
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const { id: courseId, moduleId } = await params
    const instructorId = auth.userId

    if (!moduleId) {
      return NextResponse.json(
        { error: 'Module ID es requerido' },
        { status: 400 }
      )
    }

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID es requerido' },
        { status: 400 }
      )
    }

    // ✅ Verificar que el curso pertenezca al instructor
    const supabase = await createClient()
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, instructor_id')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el instructor_id del curso coincida con el instructor autenticado
    if (course.instructor_id !== instructorId) {
      return NextResponse.json(
        { error: 'No tienes permiso para acceder a este curso' },
        { status: 403 }
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string }> }
) {
  try {
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const { id: courseId, moduleId } = await params
    const instructorId = auth.userId
    const body = await request.json() as CreateLessonData

    if (!moduleId) {
      return NextResponse.json(
        { error: 'Module ID es requerido' },
        { status: 400 }
      )
    }

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID es requerido' },
        { status: 400 }
      )
    }

    if (!body.lesson_title || !body.video_provider_id || !body.instructor_id) {
      return NextResponse.json(
        { error: 'lesson_title, video_provider_id e instructor_id son requeridos' },
        { status: 400 }
      )
    }

    // Validar que duration_seconds sea mayor a 0
    if (!body.duration_seconds || body.duration_seconds <= 0) {
      return NextResponse.json(
        { 
          error: 'La duración debe ser mayor a 0 segundos',
          details: 'El campo duration_seconds debe tener un valor positivo'
        },
        { status: 400 }
      )
    }

    // ✅ Verificar que el curso pertenezca al instructor
    const supabase = await createClient()
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, instructor_id')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el instructor_id del curso coincida con el instructor autenticado
    if (course.instructor_id !== instructorId) {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar este curso' },
        { status: 403 }
      )
    }

    const lesson = await AdminLessonsService.createLesson(moduleId, body, instructorId)

    return NextResponse.json({
      success: true,
      lesson
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al crear lección' 
      },
      { status: 500 }
    )
  }
}
