import type { Handler } from '@netlify/functions'
import { createHmac } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const DELIVERY_BATCH_SIZE = Number(process.env.NOTIFICATION_DELIVERY_BATCH_SIZE || 50)
const DEFAULT_TIMEOUT_MS = Number(process.env.SOFLIA_HUB_TIMEOUT_MS || 8000)
const PROCESSING_STALE_MINUTES = Number(
  process.env.NOTIFICATION_DELIVERY_PROCESSING_STALE_MINUTES || 15,
)

type SupabaseAdminClient = ReturnType<typeof createAdminClient>

interface DeliveryRow {
  attempts: number
  channel: string
  delivery_id: string
  destination: string | null
  max_attempts: number
  notification_id: string
  payload: Record<string, unknown>
  user_id: string
}

interface NotificationChannelsRow {
  channels_pending: string[] | null
  channels_sent: string[] | null
}

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variables de Supabase no configuradas')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function jsonResponse(statusCode: number, body: Record<string, unknown>) {
  return {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    statusCode,
  }
}

function isWhatsappDeliveryEnabled() {
  return process.env.SOFLIA_HUB_WHATSAPP_ENABLED === 'true'
}

function buildSignature(body: string, apiKey: string) {
  return createHmac('sha256', apiKey).update(body).digest('hex')
}

function calculateNextAttempt(attempts: number) {
  const delayMinutes = Math.min(60, Math.max(1, 2 ** attempts))
  return new Date(Date.now() + delayMinutes * 60 * 1000).toISOString()
}

async function postToSofliaHub(delivery: DeliveryRow) {
  const url = process.env.SOFLIA_HUB_NOTIFICATIONS_URL
  const apiKey = process.env.SOFLIA_HUB_API_KEY

  if (!url || !apiKey) {
    throw new Error('SofLIA Hub notification endpoint is not configured')
  }

  if (!delivery.destination) {
    throw new Error('Delivery destination is required')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)
  const body = JSON.stringify({
    channel: 'whatsapp',
    deliveryId: delivery.delivery_id,
    destination: delivery.destination,
    notificationId: delivery.notification_id,
    payload: delivery.payload,
    userId: delivery.user_id,
  })

  try {
    const response = await fetch(url, {
      body,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Soflia-Signature': `sha256=${buildSignature(body, apiKey)}`,
      },
      method: 'POST',
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`SofLIA Hub returned ${response.status}`)
    }

    const responseBody = await response.json().catch(() => ({}))
    return typeof responseBody?.messageId === 'string'
      ? responseBody.messageId
      : null
  } finally {
    clearTimeout(timeout)
  }
}

async function markDeliveryProcessing(
  supabase: SupabaseAdminClient,
  delivery: DeliveryRow,
) {
  const { data, error } = await supabase
    .from('notification_channel_deliveries')
    .update({
      attempts: delivery.attempts + 1,
      status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('delivery_id', delivery.delivery_id)
    .in('status', ['pending', 'failed'])
    .select('delivery_id')
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

async function syncNotificationChannels(
  supabase: SupabaseAdminClient,
  notificationId: string,
) {
  const { data, error } = await supabase
    .from('user_notifications')
    .select('channels_pending, channels_sent')
    .eq('notification_id', notificationId)
    .maybeSingle()

  if (error || !data) {
    if (error) throw error
    return
  }

  const row = data as NotificationChannelsRow
  const channelsSent = new Set(row.channels_sent || [])
  channelsSent.add('whatsapp')

  const channelsPending = (row.channels_pending || []).filter(
    (channel) => channel !== 'whatsapp',
  )

  const { error: updateError } = await supabase
    .from('user_notifications')
    .update({
      channels_pending: channelsPending,
      channels_sent: [...channelsSent],
      updated_at: new Date().toISOString(),
    })
    .eq('notification_id', notificationId)

  if (updateError) throw updateError
}

async function markDeliverySent(
  supabase: SupabaseAdminClient,
  delivery: DeliveryRow,
  providerMessageId: string | null,
) {
  const { error } = await supabase
    .from('notification_channel_deliveries')
    .update({
      last_error: null,
      provider_message_id: providerMessageId,
      sent_at: new Date().toISOString(),
      status: 'sent',
      updated_at: new Date().toISOString(),
    })
    .eq('delivery_id', delivery.delivery_id)

  if (error) throw error
  await syncNotificationChannels(supabase, delivery.notification_id)
}

async function markDeliveryFailed(
  supabase: SupabaseAdminClient,
  delivery: DeliveryRow,
  error: unknown,
) {
  const nextAttempts = delivery.attempts + 1
  const exhausted = nextAttempts >= delivery.max_attempts
  const { error: updateError } = await supabase
    .from('notification_channel_deliveries')
    .update({
      last_error: error instanceof Error ? error.message : String(error),
      next_attempt_at: exhausted
        ? new Date('9999-12-31T00:00:00.000Z').toISOString()
        : calculateNextAttempt(nextAttempts),
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('delivery_id', delivery.delivery_id)

  if (updateError) throw updateError
}

async function processDeliveries(supabase: SupabaseAdminClient) {
  if (!isWhatsappDeliveryEnabled()) {
    return { failed: 0, processed: 0, sent: 0, skipped: 'disabled' }
  }

  const staleProcessingThreshold = new Date(
    Date.now() - PROCESSING_STALE_MINUTES * 60 * 1000,
  ).toISOString()
  const { error: staleError } = await supabase
    .from('notification_channel_deliveries')
    .update({
      last_error: 'Recovered stale processing delivery',
      next_attempt_at: new Date().toISOString(),
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('channel', 'whatsapp')
    .eq('status', 'processing')
    .lt('updated_at', staleProcessingThreshold)

  if (staleError) throw staleError

  const { data, error } = await supabase
    .from('notification_channel_deliveries')
    .select('*')
    .eq('channel', 'whatsapp')
    .in('status', ['pending', 'failed'])
    .lte('next_attempt_at', new Date().toISOString())
    .order('next_attempt_at', { ascending: true })
    .limit(DELIVERY_BATCH_SIZE)

  if (error) throw error

  let failed = 0
  let processed = 0
  let sent = 0

  for (const delivery of (data || []) as DeliveryRow[]) {
    const locked = await markDeliveryProcessing(supabase, delivery)
    if (!locked) continue

    processed += 1

    try {
      const providerMessageId = await postToSofliaHub(delivery)
      await markDeliverySent(supabase, delivery, providerMessageId)
      sent += 1
    } catch (deliveryError) {
      await markDeliveryFailed(supabase, delivery, deliveryError)
      failed += 1
    }
  }

  return { failed, processed, sent }
}

const handler: Handler = async () => {
  try {
    const supabase = createAdminClient()
    const result = await processDeliveries(supabase)

    return jsonResponse(200, {
      message: 'Notification deliveries processed',
      ...result,
    })
  } catch (error) {
    console.error('Error processing notification deliveries:', error)
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export { handler }
