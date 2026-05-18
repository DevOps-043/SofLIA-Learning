import 'server-only'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createAdminClient as createSharedAdminClient } from '@/lib/supabase/admin'
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker'
import type { Database } from '../../../../../lib/supabase/types'
import { logger } from '../../../../../lib/utils/logger'
import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service'

export interface CalendarIntegrationData {
  id: string
  provider: 'google' | 'microsoft'
  access_token: string
  refresh_token?: string | null
  expires_at?: string | null
  metadata?: { secondary_calendar_id?: string } | null
}

export function createAdminClient() {
  return createSharedAdminClient()
}

export function createLegacyAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no esta configurada.')
  }

  return createServiceClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function getCalendarAccessToken(userId: string): Promise<{
  accessToken: string | null
  provider: CalendarIntegrationData['provider'] | null
  calendarId: string | null
}> {
  const supabase = createAdminClient()

  const { data: integration } = await supabase
    .from('calendar_integrations')
    .select('id, provider, access_token, refresh_token, expires_at, metadata')
    .eq('user_id', userId)
    .single()

  logger.info(
    `🔑 getCalendarAccessToken - integracion encontrada: ${!!integration}, access_token: ${integration?.access_token ? 'SI' : 'NO'}`,
  )

  if (!integration || !integration.access_token) {
    logger.warn('No hay integracion de calendario o no hay access_token')
    return { accessToken: null, provider: null, calendarId: null }
  }

  const metadata = integration.metadata as { secondary_calendar_id?: string } | null
  let calendarId = metadata?.secondary_calendar_id || null

  const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null
  const now = new Date()
  let accessToken = integration.access_token

  logger.info(
    `🔑 Token expira: ${expiresAt?.toISOString() || 'desconocido'}, ahora: ${now.toISOString()}`,
  )

  if (expiresAt && expiresAt < now && integration.refresh_token) {
    logger.info('Refrescando token de calendario expirado...')
    const refreshed = await refreshAccessToken(integration as CalendarIntegrationData)
    if (refreshed.success && refreshed.accessToken) {
      accessToken = refreshed.accessToken
    } else {
      logger.error('No se pudo refrescar el token del calendario')
    }
  }

  if (!calendarId && integration.provider === 'google' && accessToken) {
    calendarId = await CalendarIntegrationService.getOrCreatePlatformCalendar(accessToken)

    if (calendarId) {
      await supabase
        .from('calendar_integrations')
        .update({
          metadata: { secondary_calendar_id: calendarId },
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id)
    }
  }

  return {
    accessToken,
    provider: integration.provider,
    calendarId,
  }
}

export async function refreshAccessToken(
  integration: CalendarIntegrationData,
): Promise<{ success: boolean; accessToken?: string }> {
  try {
    if (integration.provider === 'google') {
      const googleClientId =
        process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''
      const googleClientSecret =
        process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || ''

      const response = await fetchWithCircuitBreaker('google-oauth-dashboard-chat', 'https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: googleClientId,
          client_secret: googleClientSecret,
          refresh_token: integration.refresh_token || '',
          grant_type: 'refresh_token',
        }),
      })

      if (!response.ok) {
        logger.error('Error refrescando token de Google:', await response.text())
        return { success: false }
      }

      const tokens = await response.json()

      const supabase = createAdminClient()
      await supabase
        .from('calendar_integrations')
        .update({
          access_token: tokens.access_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq('id', integration.id)

      return { success: true, accessToken: tokens.access_token }
    }

    return { success: false }
  } catch (error) {
    logger.error('Error refrescando token:', error)
    return { success: false }
  }
}
