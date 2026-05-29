import { NextRequest, NextResponse } from 'next/server'

import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

interface RecentActivityRow {
  created_at: string | null
  message: string
  metadata: unknown
  notification_id: string
  notification_type: string
  organization_id: string | null
  priority: string | null
  status: string | null
  title: string
  user_id: string
  user_name: string | null
}

interface NotificationRow {
  created_at: string | null
  message: string
  metadata: unknown
  notification_id: string
  notification_type: string
  organization_id: string | null
  priority: string | null
  status: string | null
  title: string
  user_id: string
}

interface NotificationUserRow {
  display_name: string | null
  first_name: string | null
  id: string
  last_name: string | null
}

interface ActivityCourseRow {
  title: string | null
}

interface CompletedCourseRow {
  completed_at: string | null
  completion_percentage: number | null
  user: NotificationUserRow | null
  course: ActivityCourseRow | null
}

interface NewUserRow {
  joined_at: string | null
  user: NotificationUserRow | null
}

interface StartedCourseRow {
  assigned_at: string | null
  completion_percentage: number | null
  user: NotificationUserRow | null
  course: ActivityCourseRow | null
}

interface LegacyActivityRow {
  action: string
  createdAt: string | null
  icon: string
  message: string
  time: string
  timestamp: Date
  title: string
  user: string
}

interface BusinessActivityRpcClient {
  rpc(
    fn: 'get_business_recent_activity',
    args: { target_organization_id: string; max_rows: number },
  ): PromiseLike<{
    data: RecentActivityRow[] | null
    error: { message?: string } | null
  }>
}

type BusinessActivityClient = Awaited<ReturnType<typeof createClient>>

function normalizeMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function getDisplayName(user: NotificationUserRow | undefined): string {
  return user?.display_name ||
    `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
    'Usuario'
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return 'hace un momento'

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return 'hace un momento'
  if (diffMinutes === 1) return 'hace 1 minuto'
  if (diffMinutes < 60) return `hace ${diffMinutes} minutos`
  if (diffHours === 1) return 'hace 1 hora'
  if (diffHours < 24) return `hace ${diffHours} horas`
  if (diffDays === 1) return 'hace 1 dia'
  if (diffDays < 7) return `hace ${diffDays} dias`

  const weeks = Math.floor(diffDays / 7)
  if (weeks === 1) return 'hace 1 semana'
  if (weeks < 5) return `hace ${weeks} semanas`

  const months = Math.floor(diffDays / 30)
  return months <= 1 ? 'hace 1 mes' : `hace ${months} meses`
}

function mapRecentActivityRow(notification: RecentActivityRow) {
  return {
    createdAt: notification.created_at,
    id: notification.notification_id,
    message: notification.message,
    metadata: normalizeMetadata(notification.metadata),
    notificationType: notification.notification_type,
    priority: notification.priority || 'medium',
    status: notification.status || 'unread',
    time: formatTimeAgo(notification.created_at),
    title: notification.title,
    user: notification.user_name || 'Usuario',
  }
}

function mapNotificationRow(
  notification: NotificationRow,
  usersById: Map<string, NotificationUserRow>,
) {
  return {
    createdAt: notification.created_at,
    id: notification.notification_id,
    message: notification.message,
    metadata: normalizeMetadata(notification.metadata),
    notificationType: notification.notification_type,
    priority: notification.priority || 'medium',
    status: notification.status || 'unread',
    time: formatTimeAgo(notification.created_at),
    title: notification.title,
    user: getDisplayName(usersById.get(notification.user_id)),
  }
}

async function loadRecentActivityFromRpc(
  supabase: BusinessActivityClient,
  organizationId: string,
) {
  const { data, error } = await (
    supabase as unknown as BusinessActivityRpcClient
  ).rpc('get_business_recent_activity', {
    target_organization_id: organizationId,
    max_rows: 12,
  })

  if (error) {
    logger.warn('Business recent activity RPC unavailable, using fallback', {
      organizationId,
      error: error.message,
    })
    return null
  }

  return (data || []).slice(0, 12).map(mapRecentActivityRow)
}

async function loadRecentActivityFallback(
  supabase: BusinessActivityClient,
  organizationId: string,
) {
  const { data: notifications, error: notificationsError } = await supabase
    .from('user_notifications')
    .select(`
      created_at,
      message,
      metadata,
      notification_id,
      notification_type,
      organization_id,
      priority,
      status,
      title,
      user_id
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(12)
    .returns<NotificationRow[]>()

  if (notificationsError) {
    logger.error('Error fetching business recent notifications fallback:', notificationsError)
    return []
  }

  const userIds = Array.from(new Set((notifications || []).map((item) => item.user_id)))
  const usersById = new Map<string, NotificationUserRow>()

  if (userIds.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, display_name, first_name, last_name')
      .in('id', userIds)
      .returns<NotificationUserRow[]>()

    if (usersError) {
      logger.warn('Error fetching business recent activity users:', usersError)
    }

    for (const user of users || []) {
      usersById.set(user.id, user)
    }
  }

  return (notifications || []).map((notification) =>
    mapNotificationRow(notification, usersById),
  )
}

async function loadLegacyActivityFallback(
  supabase: BusinessActivityClient,
  organizationId: string,
) {
  const [
    { data: orgData, error: orgError },
    { data: completedCourses, error: completedError },
    { data: newUsers, error: newUsersError },
    { data: startedCourses, error: startedError },
  ] = await Promise.all([
    supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single(),
    supabase
      .from('organization_course_assignments')
      .select(`
        completed_at,
        completion_percentage,
        user:users!inner (
          id,
          first_name,
          last_name,
          display_name
        ),
        course:courses!inner (
          title
        )
      `)
      .eq('organization_id', organizationId)
      .or('status.eq.completed,completion_percentage.gte.100')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5)
      .returns<CompletedCourseRow[]>(),
    supabase
      .from('organization_users')
      .select(`
        joined_at,
        user:users!inner (
          id,
          first_name,
          last_name,
          display_name
        )
      `)
      .eq('organization_id', organizationId)
      .not('joined_at', 'is', null)
      .order('joined_at', { ascending: false })
      .limit(3)
      .returns<NewUserRow[]>(),
    supabase
      .from('organization_course_assignments')
      .select(`
        assigned_at,
        completion_percentage,
        user:users!inner (
          id,
          first_name,
          last_name,
          display_name
        ),
        course:courses!inner (
          title
        )
      `)
      .eq('organization_id', organizationId)
      .gt('completion_percentage', 0)
      .lt('completion_percentage', 100)
      .order('assigned_at', { ascending: false })
      .limit(3)
      .returns<StartedCourseRow[]>(),
  ])

  if (orgError) logger.warn('Error fetching organization for recent activity:', orgError)
  if (completedError) logger.warn('Error fetching completed courses for recent activity:', completedError)
  if (newUsersError) logger.warn('Error fetching new users for recent activity:', newUsersError)
  if (startedError) logger.warn('Error fetching started courses for recent activity:', startedError)

  const orgName = orgData?.name || 'tu organizacion'
  const activities: LegacyActivityRow[] = []

  for (const item of completedCourses || []) {
    const courseTitle = item.course?.title || 'curso'
    const action = `completo el curso de ${courseTitle}`

    activities.push({
      action,
      createdAt: item.completed_at,
      icon: 'CheckCircle',
      message: action,
      time: formatTimeAgo(item.completed_at),
      timestamp: new Date(item.completed_at || 0),
      title: action,
      user: getDisplayName(item.user || undefined),
    })
  }

  for (const item of newUsers || []) {
    const action = `se unio a ${orgName}`

    activities.push({
      action,
      createdAt: item.joined_at,
      icon: 'Users',
      message: action,
      time: formatTimeAgo(item.joined_at),
      timestamp: new Date(item.joined_at || 0),
      title: action,
      user: getDisplayName(item.user || undefined),
    })
  }

  for (const item of startedCourses || []) {
    const courseTitle = item.course?.title || 'curso'
    const action = `inicio el curso de ${courseTitle}`

    activities.push({
      action,
      createdAt: item.assigned_at,
      icon: 'BookOpen',
      message: action,
      time: formatTimeAgo(item.assigned_at),
      timestamp: new Date(item.assigned_at || 0),
      title: action,
      user: getDisplayName(item.user || undefined),
    })
  }

  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10)
    .map(({ timestamp, ...activity }) => activity)
}

async function loadRecentActivity(
  supabase: BusinessActivityClient,
  organizationId: string,
) {
  const rpcActivity = await loadRecentActivityFromRpc(supabase, organizationId)
  if (rpcActivity && rpcActivity.length > 0) return rpcActivity

  const notificationActivity = await loadRecentActivityFallback(supabase, organizationId)
  if (notificationActivity.length > 0) return notificationActivity

  return loadLegacyActivityFallback(supabase, organizationId)
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes una organizacion asignada',
        },
        { status: 403 },
      )
    }

    const supabase = await createClient()
    const activities = await loadRecentActivity(supabase, auth.organizationId)

    return NextResponse.json(
      {
        success: true,
        activities,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=90',
        },
      },
    )
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business/dashboard/activity:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener actividad reciente',
        activities: [],
      },
      { status: 500 },
    )
  }
}
