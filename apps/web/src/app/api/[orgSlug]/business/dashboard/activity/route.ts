import { NextRequest, NextResponse } from 'next/server'

import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createAdminClient } from '@/lib/supabase/admin'
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

interface BusinessActivityRpcClient {
  rpc(
    fn: 'get_business_recent_activity',
    args: { target_organization_id: string; max_rows: number },
  ): PromiseLike<{
    data: RecentActivityRow[] | null
    error: { message?: string } | null
  }>
}

function normalizeMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
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

    const supabase = createAdminClient()
    const { data: notifications, error: notificationsError } = await (
      supabase as unknown as BusinessActivityRpcClient
    ).rpc('get_business_recent_activity', {
      target_organization_id: auth.organizationId,
      max_rows: 12,
    })

    if (notificationsError) {
      logger.error('Error fetching business recent notifications:', notificationsError)
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener actividad reciente',
          activities: [],
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        activities: (notifications || [])
          .slice(0, 12)
          .map((notification) => ({
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
          })),
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
