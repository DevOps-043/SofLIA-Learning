import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AdminActivitiesService, UpdateActivityData } from '@/features/admin/services/adminActivities.service'
import { validateUpdateActivityPayload } from '@/features/admin/services/adminActivityPayload.service'
import { requireInstructor } from '@/lib/auth/requireAdmin'
import { createClient } from '@/lib/supabase/server'

async function verifyInstructorCourseAccess(courseId: string, instructorId: string) {
  const supabase = await createClient()
  const { data: course, error } = await supabase
    .from('courses')
    .select('id, instructor_id')
    .eq('id', courseId)
    .single()

  if (error || !course) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  }

  if (course.instructor_id !== instructorId) {
    return NextResponse.json(
      { error: 'No tienes permiso para modificar este curso' },
      { status: 403 }
    )
  }

  return null
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string; activityId: string }> }
) {
  try {
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth

    const { id: courseId, activityId, lessonId } = await params
    if (!courseId || !lessonId || !activityId) {
      return NextResponse.json(
        { error: 'Course ID, Lesson ID y Activity ID son requeridos' },
        { status: 400 }
      )
    }

    const unauthorizedResponse = await verifyInstructorCourseAccess(courseId, auth.userId)
    if (unauthorizedResponse) return unauthorizedResponse

    const body = validateUpdateActivityPayload(await request.json()) as UpdateActivityData
    const activity = await AdminActivitiesService.updateActivity(activityId, body)

    return NextResponse.json({ success: true, activity })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || 'Payload de actividad invalido' },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('external_tool_key')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { success: false, error: 'Error al actualizar actividad' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string; activityId: string }> }
) {
  try {
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth

    const { id: courseId, activityId, lessonId } = await params
    if (!courseId || !lessonId || !activityId) {
      return NextResponse.json(
        { error: 'Course ID, Lesson ID y Activity ID son requeridos' },
        { status: 400 }
      )
    }

    const unauthorizedResponse = await verifyInstructorCourseAccess(courseId, auth.userId)
    if (unauthorizedResponse) return unauthorizedResponse

    await AdminActivitiesService.deleteActivity(activityId)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error al eliminar actividad' },
      { status: 500 }
    )
  }
}
