import { NextRequest, NextResponse } from 'next/server'
import { AdminActivitiesService, UpdateActivityData } from '@/features/admin/services/adminActivities.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

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

    const body = await request.json() as UpdateActivityData

    const activity = await AdminActivitiesService.updateActivity(activityId, body)

    return NextResponse.json({
      success: true,
      activity
    })
  } catch (error) {
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

