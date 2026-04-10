import { NextRequest, NextResponse } from 'next/server'
import { AdminActivitiesService, UpdateActivityData } from '@/features/admin/services/adminActivities.service'
import { validateUpdateActivityPayload } from '@/features/admin/services/adminActivityPayload.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { ZodError } from 'zod'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string, lessonId: string, activityId: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const resolvedParams = await params
    const { activityId, lessonId } = resolvedParams

    if (!activityId || !lessonId) {
      return NextResponse.json(
        { error: 'Activity ID y Lesson ID son requeridos' },
        { status: 400 }
      )
    }

    const body = validateUpdateActivityPayload(await request.json()) as UpdateActivityData

    const activity = await AdminActivitiesService.updateActivity(activityId, body)

    return NextResponse.json({
      success: true,
      activity
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || 'Payload de actividad invalido' },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('external_tool_key')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Error al actualizar actividad' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string, lessonId: string, activityId: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const resolvedParams = await params
    const { activityId, lessonId } = resolvedParams

    if (!activityId || !lessonId) {
      return NextResponse.json(
        { error: 'Activity ID y Lesson ID son requeridos' },
        { status: 400 }
      )
    }

    await AdminActivitiesService.deleteActivity(activityId)

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al eliminar actividad' 
      },
      { status: 500 }
    )
  }
}
