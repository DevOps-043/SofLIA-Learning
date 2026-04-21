import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { handleCalendarEventDelete } from './event-delete-route.handler'
import { getErrorMessage } from './event-route.types'
import { handleCalendarEventUpdate } from './event-update-route.handler'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    return handleCalendarEventUpdate(user.id, id, body)
  } catch (error: unknown) {
    console.error('Error en PUT /api/study-planner/events/[id]:', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    return handleCalendarEventDelete(user.id, id)
  } catch (error: unknown) {
    console.error('Error en DELETE /api/study-planner/events/[id]:', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}
