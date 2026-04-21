import { NextResponse } from 'next/server'
import {
  createAdminClient,
  deleteGoogleCalendarEvent,
  refreshAccessToken,
} from './event-update.service'
import { getErrorMessage } from './event-route.types'

export async function handleCalendarEventDelete(
  userId: string,
  id: string,
): Promise<NextResponse> {
  const supabase = createAdminClient()
  const { data: existingEvent, error: fetchError } = await supabase
    .from('user_calendar_events')
    .select('id, user_id, provider, google_event_id')
    .eq('user_id', userId)
    .or(`id.eq.${id},google_event_id.eq.${id}`)
    .single()

  if (fetchError || !existingEvent) {
    return deleteExternalGoogleEvent(userId, id)
  }

  if (existingEvent.provider === 'google' && existingEvent.google_event_id) {
    try {
      await deleteSyncedGoogleEvent(userId, existingEvent.google_event_id)
    } catch (error) {
      console.error('Error eliminando de Google Calendar:', error)
    }
  }

  const { error: deleteError } = await supabase
    .from('user_calendar_events')
    .delete()
    .eq('id', existingEvent.id)
    .eq('user_id', userId)

  if (deleteError) {
    console.error('Error eliminando evento:', deleteError)
    return NextResponse.json(
      { error: 'Error al eliminar el evento' },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true, message: 'Evento eliminado exitosamente' })
}

async function deleteExternalGoogleEvent(userId: string, id: string): Promise<NextResponse> {
  try {
    await deleteSyncedGoogleEvent(userId, id, true)
    return NextResponse.json({ success: true, message: 'Evento eliminado exitosamente' })
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    console.error('Error eliminando evento de Google Calendar:', error)
    if (errorMessage === 'NO_GOOGLE_INTEGRATION') {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

async function deleteSyncedGoogleEvent(
  userId: string,
  googleEventId: string,
  fallbackToPrimary = false,
): Promise<void> {
  const supabase = createAdminClient()
  const { data: integration } = await supabase
    .from('calendar_integrations')
    .select('id, access_token, refresh_token, provider, expires_at, metadata')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single()

  if (!integration) {
    throw new Error('NO_GOOGLE_INTEGRATION')
  }

  let accessToken = integration.access_token
  const tokenExpiry = integration.expires_at ? new Date(integration.expires_at) : null

  if (tokenExpiry && tokenExpiry <= new Date() && integration.refresh_token) {
    const refreshResult = await refreshAccessToken(integration)
    if (refreshResult.success && refreshResult.accessToken) {
      accessToken = refreshResult.accessToken
      const { data: updatedIntegration } = await supabase
        .from('calendar_integrations')
        .select('access_token')
        .eq('id', integration.id)
        .single()
      if (updatedIntegration?.access_token) {
        accessToken = updatedIntegration.access_token
      }
    }
  }

  const metadata = integration.metadata as { secondary_calendar_id?: string } | null
  const secondaryCalendarId = metadata?.secondary_calendar_id || null

  try {
    await deleteGoogleCalendarEvent(accessToken, googleEventId, secondaryCalendarId)
  } catch (error: unknown) {
    if (!fallbackToPrimary || !shouldRetryPrimary(error)) {
      throw error
    }

    await deleteGoogleCalendarEvent(accessToken, googleEventId, 'primary')
  }
}

function shouldRetryPrimary(error: unknown): boolean {
  const message = getErrorMessage(error)
  return message.includes('404')
    || message.includes('410')
    || message.includes('Not Found')
    || message.includes('Deleted')
}
