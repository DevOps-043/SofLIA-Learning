import { NextRequest, NextResponse } from 'next/server'

import { AdminActivitiesService, CreateActivityData } from '@/features/admin/services/adminActivities.service'

import { validateCreateActivityPayload } from '@/features/admin/services/adminActivityPayload.service'

import { requireAdmin } from '@/lib/auth/requireAdmin'

import { ZodError } from 'zod'

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
