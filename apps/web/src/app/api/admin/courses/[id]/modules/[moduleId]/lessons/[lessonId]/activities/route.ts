import { NextRequest, NextResponse } from 'next/server'
import { AdminActivitiesService, CreateActivityData } from '@/features/admin/services/adminActivities.service'
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
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { lessonId } = await params
    const body = await request.json() as CreateActivityData
    const adminUserId = auth.userId

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID es requerido' },
        { status: 400 }
      )
    }

    if (!body.activity_title || !body.activity_type || !body.activity_content) {
      return NextResponse.json(
        { error: 'activity_title, activity_type y activity_content son requeridos' },
        { status: 400 }
      )
    }

    const activity = await AdminActivitiesService.createActivity(lessonId, body, adminUserId)

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

