import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const BATCH_SIZE = Number(process.env.LEARNING_REMINDERS_BATCH_SIZE || 500)
const DEFAULT_REMINDER_HOUR = Number(process.env.LEARNING_REMINDERS_LOCAL_HOUR || 9)

type SupabaseAdminClient = ReturnType<typeof createAdminClient>

interface EnrollmentRow {
  course_id: string
  enrollment_id: string
  last_accessed_at: string | null
  organization_id: string | null
  overall_progress_percentage: number | null
  user_id: string
  courses?: {
    slug: string | null
    title: string | null
  } | null
}

interface UserPreferenceRow {
  timezone: string | null
  user_id: string
  whatsapp_enabled: boolean | null
}

interface UserProfileRow {
  country_code: string | null
  id: string
  phone: string | null
}

interface OrganizationPlanRow {
  id: string
  subscription_plan: string | null
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

function getLocalDateParts(timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    month: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(new Date())

  const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return {
    date: `${partMap.year}-${partMap.month}-${partMap.day}`,
    hour: Number(partMap.hour),
  }
}

function normalizePhone(profile: UserProfileRow | undefined) {
  const rawPhone = profile?.phone?.replace(/[^\d+]/g, '') || ''
  if (!rawPhone) return null
  if (rawPhone.startsWith('+')) return rawPhone

  const countryCode = profile?.country_code?.replace(/[^\d]/g, '')
  return countryCode ? `+${countryCode}${rawPhone}` : rawPhone
}

function isWhatsappPlan(plan: string | null | undefined) {
  const normalizedPlan = plan?.toLowerCase()
  return normalizedPlan === 'business' || normalizedPlan === 'enterprise'
}

function getCourseUrl(enrollment: EnrollmentRow) {
  const slug = enrollment.courses?.slug
  return slug ? `/courses/${slug}/learn` : '/dashboard'
}

function getCourseTitle(enrollment: EnrollmentRow) {
  return enrollment.courses?.title || 'tu curso'
}

function getProgress(enrollment: EnrollmentRow) {
  return Math.max(0, Math.min(99, Math.round(enrollment.overall_progress_percentage || 0)))
}

async function loadReminderInputs(
  supabase: SupabaseAdminClient,
  enrollments: EnrollmentRow[],
) {
  const userIds = [...new Set(enrollments.map((enrollment) => enrollment.user_id))]
  const organizationIds = [
    ...new Set(
      enrollments
        .map((enrollment) => enrollment.organization_id)
        .filter((organizationId): organizationId is string => Boolean(organizationId)),
    ),
  ]

  const [preferencesResult, usersResult, organizationsResult] = await Promise.all([
    supabase
      .from('user_notification_preferences')
      .select('user_id, timezone, whatsapp_enabled')
      .in('user_id', userIds)
      .eq('notification_type', 'learning_daily_summary'),
    supabase
      .from('users')
      .select('id, country_code, phone')
      .in('id', userIds),
    organizationIds.length
      ? supabase
          .from('organizations')
          .select('id, subscription_plan')
          .in('id', organizationIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (preferencesResult.error) throw preferencesResult.error
  if (usersResult.error) throw usersResult.error
  if (organizationsResult.error) throw organizationsResult.error

  return {
    organizationsById: new Map(
      ((organizationsResult.data || []) as OrganizationPlanRow[]).map((organization) => [
        organization.id,
        organization,
      ]),
    ),
    preferencesByUserId: new Map(
      ((preferencesResult.data || []) as UserPreferenceRow[]).map((preference) => [
        preference.user_id,
        preference,
      ]),
    ),
    usersById: new Map(
      ((usersResult.data || []) as UserProfileRow[]).map((user) => [user.id, user]),
    ),
  }
}

async function notificationExists(
  supabase: SupabaseAdminClient,
  userId: string,
  dedupKey: string,
) {
  const { data, error } = await supabase
    .from('user_notifications')
    .select('notification_id')
    .eq('user_id', userId)
    .eq('notification_type', 'learning_daily_summary')
    .eq('dedup_key', dedupKey)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

async function enqueueWhatsappDelivery(
  supabase: SupabaseAdminClient,
  input: {
    destination: string
    notificationId: string
    organizationId: string | null
    payload: Record<string, unknown>
    userId: string
  },
) {
  const { error } = await supabase
    .from('notification_channel_deliveries')
    .upsert(
      {
        channel: 'whatsapp',
        destination: input.destination,
        max_attempts: 5,
        notification_id: input.notificationId,
        organization_id: input.organizationId,
        payload: input.payload,
        status: 'pending',
        user_id: input.userId,
      },
      { onConflict: 'notification_id,channel' },
    )

  if (error) throw error
}

async function createReminderNotification(
  supabase: SupabaseAdminClient,
  enrollment: EnrollmentRow,
  localDate: string,
  shouldQueueWhatsapp: boolean,
  destination: string | null,
) {
  const courseTitle = getCourseTitle(enrollment)
  const progress = getProgress(enrollment)
  const actionUrl = getCourseUrl(enrollment)
  const dedupKey = `${enrollment.user_id}:${localDate}`
  const pendingChannels = shouldQueueWhatsapp ? ['whatsapp'] : []
  const metadata = {
    action_url: actionUrl,
    course_id: enrollment.course_id,
    courseTitle,
    enrollment_id: enrollment.enrollment_id,
    is_localized: true,
    progress,
    timestamp: new Date().toISOString(),
  }

  if (await notificationExists(supabase, enrollment.user_id, dedupKey)) {
    return { created: false, queuedWhatsapp: false }
  }

  const { data, error } = await supabase
    .from('user_notifications')
    .insert({
      channels_pending: pendingChannels,
      channels_sent: ['in_app'],
      dedup_key: dedupKey,
      message: 'notifications.types.learning_daily_summary.message',
      metadata,
      notification_type: 'learning_daily_summary',
      organization_id: enrollment.organization_id,
      priority: 'medium',
      status: 'unread',
      title: 'notifications.types.learning_daily_summary.title',
      user_id: enrollment.user_id,
    })
    .select('notification_id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { created: false, queuedWhatsapp: false }
    }

    throw error
  }

  if (shouldQueueWhatsapp && destination) {
    await enqueueWhatsappDelivery(supabase, {
      destination,
      notificationId: data.notification_id,
      organizationId: enrollment.organization_id,
      payload: {
        actionUrl,
        courseTitle,
        dedupKey,
        isLocalized: true,
        message: 'notifications.types.learning_daily_summary.message',
        metadata,
        notificationId: data.notification_id,
        notificationType: 'learning_daily_summary',
        priority: 'medium',
        title: 'notifications.types.learning_daily_summary.title',
      },
      userId: enrollment.user_id,
    })
  }

  return {
    created: true,
    queuedWhatsapp: shouldQueueWhatsapp && Boolean(destination),
  }
}

async function processReminders(supabase: SupabaseAdminClient) {
  const { data, error } = await supabase
    .from('user_course_enrollments')
    .select(`
      enrollment_id,
      user_id,
      course_id,
      organization_id,
      overall_progress_percentage,
      last_accessed_at,
      courses!user_course_enrollments_course_id_fkey(title, slug)
    `)
    .or('enrollment_status.is.null,enrollment_status.neq.completed')
    .or('overall_progress_percentage.is.null,overall_progress_percentage.lt.100')
    .order('last_accessed_at', { ascending: false, nullsFirst: false })
    .limit(BATCH_SIZE)

  if (error) throw error

  const latestEnrollmentByUser = new Map<string, EnrollmentRow>()
  for (const enrollment of (data || []) as EnrollmentRow[]) {
    if (!latestEnrollmentByUser.has(enrollment.user_id)) {
      latestEnrollmentByUser.set(enrollment.user_id, enrollment)
    }
  }

  const enrollments = [...latestEnrollmentByUser.values()]
  if (!enrollments.length) {
    return { candidates: 0, created: 0, queuedWhatsapp: 0, skippedByHour: 0 }
  }

  const { organizationsById, preferencesByUserId, usersById } =
    await loadReminderInputs(supabase, enrollments)

  let created = 0
  let queuedWhatsapp = 0
  let skippedByHour = 0

  for (const enrollment of enrollments) {
    const preference = preferencesByUserId.get(enrollment.user_id)
    const timezone = preference?.timezone || 'UTC'
    const localDateParts = getLocalDateParts(timezone)

    if (localDateParts.hour !== DEFAULT_REMINDER_HOUR) {
      skippedByHour += 1
      continue
    }

    const organization = enrollment.organization_id
      ? organizationsById.get(enrollment.organization_id)
      : null
    const destination = normalizePhone(usersById.get(enrollment.user_id))
    const shouldQueueWhatsapp = Boolean(
      preference?.whatsapp_enabled &&
      destination &&
      isWhatsappPlan(organization?.subscription_plan),
    )

    const result = await createReminderNotification(
      supabase,
      enrollment,
      localDateParts.date,
      shouldQueueWhatsapp,
      destination,
    )

    if (result.created) created += 1
    if (result.queuedWhatsapp) queuedWhatsapp += 1
  }

  return {
    candidates: enrollments.length,
    created,
    queuedWhatsapp,
    skippedByHour,
  }
}

const handler: Handler = async () => {
  try {
    const supabase = createAdminClient()
    const result = await processReminders(supabase)

    return jsonResponse(200, {
      message: 'Learning reminders processed',
      ...result,
    })
  } catch (error) {
    console.error('Error processing learning reminders:', error)
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export { handler }
