import { NextRequest, NextResponse } from 'next/server'
import { AdminActivitiesService, CreateActivityData } from '@/features/admin/services/adminActivities.service'
import { requireInstructor } from '@/lib/auth/requireAdmin'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string, lessonId: string }> }
) {
  try {
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const { id: courseId, lessonId } = await params
    const instructorId = auth.userId

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID es requerido' },
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

    const activities = await AdminActivitiesService.getLessonActivities(lessonId)

    return NextResponse.json({
      success: true,
      activities
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener actividades' 
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string, lessonId: string }> }
) {
  try {
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const { id: courseId, lessonId } = await params
    const instructorId = auth.userId
    const body = await request.json() as CreateActivityData

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID es requerido' },
        { status: 400 }
      )
    }

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID es requerido' },
        { status: 400 }
      )
    }

    if (!body.activity_title || !body.activity_type || !body.activity_content) {
      return NextResponse.json(
        { error: 'activity_title, activity_type y activity_content son requeridos' },
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

    const activity = await AdminActivitiesService.createActivity(lessonId, body, instructorId)

    return NextResponse.json({
      success: true,
      activity
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al crear actividad' 
      },
      { status: 500 }
    )
  }
}

