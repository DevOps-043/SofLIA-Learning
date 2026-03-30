import { NextRequest, NextResponse } from 'next/server'
import { AdminActivitiesService, UpdateActivityData } from '@/features/admin/services/adminActivities.service'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const { activityId } = await params
    const body = await request.json() as UpdateActivityData
    if (!activityId) {
      return NextResponse.json({ error: 'activityId es requerido' }, { status: 400 })
    }
    const activity = await AdminActivitiesService.updateActivity(activityId, body)
    return NextResponse.json({ success: true, activity })
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar actividad' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const { activityId } = await params
    if (!activityId) {
      return NextResponse.json({ error: 'activityId es requerido' }, { status: 400 })
    }
    await AdminActivitiesService.deleteActivity(activityId)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar actividad' }, { status: 500 })
  }
}


