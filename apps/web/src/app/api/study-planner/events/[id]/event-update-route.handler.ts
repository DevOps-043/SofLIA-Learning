import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextResponse } from 'next/server'
import {
  createAdminClient,
  updateGoogleCalendarEvent,
} from './event-update.service'
import type { CalendarEventRouteBody } from './event-route.types'

export async function handleCalendarEventUpdate(
  userId: string,
  id: string,
  body: CalendarEventRouteBody,
): Promise<NextResponse> {
  const { title, description, start, end, location, isAllDay, color } = body

  if (!title || !start || !end) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos: title, start, end' },
      { status: 400 },
    )
  }

  const supabase = createAdminClient()
  const { data: existingEvent, error: fetchError } = await supabase
    .from('user_calendar_events')
    .select('id, user_id, provider, google_event_id')
    .eq('user_id', userId)
    .or(`id.eq.${id},google_event_id.eq.${id}`)
    .single()

  if (fetchError || !existingEvent) {
    return updateExternalGoogleEvent(userId, id, body)
  }

  if (existingEvent.provider === 'google' && existingEvent.google_event_id) {
    const { data: integration } = await supabase
      .from('calendar_integrations')
      .select('access_token, refresh_token, provider, metadata')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single()

    if (integration?.access_token) {
      try {
        const metadata = integration.metadata as { secondary_calendar_id?: string } | null
        await updateGoogleCalendarEvent(
          integration.access_token,
          existingEvent.google_event_id,
          { title, description, start, end, location, isAllDay },
          metadata?.secondary_calendar_id || null,
        )
      } catch (error) {
        techDebtLogger.error('Error actualizando en Google Calendar:', error)
      }
    }
  }

  const { data: updatedEvent, error: updateError } = await supabase
    .from('user_calendar_events')
    .update({
      title,
      description: description || null,
      start_time: start,
      end_time: end,
      location: location || null,
      is_all_day: isAllDay || false,
      color: color || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (updateError) {
    techDebtLogger.error('Error actualizando evento:', updateError)
    return NextResponse.json(
      { error: 'Error al actualizar el evento' },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true, event: updatedEvent })
}

async function updateExternalGoogleEvent(
  userId: string,
  id: string,
  body: CalendarEventRouteBody,
): Promise<NextResponse> {
  const { title, description, start, end, location, isAllDay, color } = body
  const supabase = createAdminClient()
  const { data: integration } = await supabase
    .from('calendar_integrations')
    .select('access_token, provider, metadata')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single()

  if (!integration?.access_token || !title || !start || !end) {
    return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  }

  try {
    const metadata = integration.metadata as { secondary_calendar_id?: string } | null
    await updateGoogleCalendarEvent(
      integration.access_token,
      id,
      { title, description, start, end, location, isAllDay },
      metadata?.secondary_calendar_id || null,
    )

    const { data: existingByGoogleId } = await supabase
      .from('user_calendar_events')
      .select('id')
      .eq('user_id', userId)
      .eq('google_event_id', id)
      .single()

    if (existingByGoogleId) {
      const { data: updatedEvent } = await supabase
        .from('user_calendar_events')
        .update({
          title,
          description: description || null,
          start_time: start,
          end_time: end,
          location: location || null,
          is_all_day: isAllDay || false,
          color: color || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingByGoogleId.id)
        .select()
        .single()

      return NextResponse.json({ success: true, event: updatedEvent })
    }

    const { data: newEvent } = await supabase
      .from('user_calendar_events')
      .insert({
        user_id: userId,
        title,
        description: description || null,
        start_time: start,
        end_time: end,
        location: location || null,
        is_all_day: isAllDay || false,
        provider: 'google',
        source: 'calendar_sync',
        google_event_id: id,
        color: color || null,
      })
      .select()
      .single()

    return NextResponse.json({ success: true, event: newEvent })
  } catch (error) {
    techDebtLogger.error('Error actualizando evento de Google Calendar:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el evento en Google Calendar' },
      { status: 500 },
    )
  }
}
