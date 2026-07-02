import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'
import { createBusinessUsersAdminClient } from '@/features/business-panel/services/business-users-server/client'
import { NotificationService } from '@/features/notifications/services/notification.service'

const remindGoalBodySchema = z.object({
  goalId: z.string().trim().regex(/^[a-zA-Z0-9_-]{1,80}$/, 'goalId invalido'),
  goalText: z.string().trim().min(1).max(300),
  actionHref: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .refine((value) => value.startsWith('/') && !value.startsWith('//'), {
      message: 'actionHref debe ser una ruta relativa',
    }),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; userId: string }> },
) {
  try {
    const { orgSlug, userId } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organizacion asignada' },
        { status: 403 },
      )
    }

    const body = remindGoalBodySchema.safeParse(await request.json().catch(() => null))
    if (!body.success) {
      return NextResponse.json(
        { success: false, error: 'Datos invalidos para enviar el recordatorio' },
        { status: 400 },
      )
    }

    const supabase = createBusinessUsersAdminClient()
    const membership = await validateOrganizationUser({
      supabase,
      organizationId: auth.organizationId,
      userId,
    })

    if (!membership.ok) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado o no pertenece a tu organizacion' },
        { status: 403 },
      )
    }

    const { goalId, goalText, actionHref } = body.data
    const today = new Date().toISOString().slice(0, 10)

    await NotificationService.createNotification({
      userId,
      notificationType: 'business_goal_reminder',
      title: 'notifications.types.business_goal_reminder.title',
      message: 'notifications.types.business_goal_reminder.message',
      isLocalized: true,
      organizationId: auth.organizationId,
      priority: 'medium',
      dedupKey: `business-goal-reminder:${userId}:${goalId}:${today}`,
      metadata: {
        goalText,
        goal_id: goalId,
        action_url: actionHref,
        sent_by: auth.userId,
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({ success: true, message: 'Recordatorio enviado exitosamente' })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business/users/[userId]/goals/remind:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al enviar el recordatorio' },
      { status: 500 },
    )
  }
}

async function validateOrganizationUser({
  supabase,
  organizationId,
  userId,
}: {
  supabase: ReturnType<typeof createBusinessUsersAdminClient>
  organizationId: string
  userId: string
}) {
  const { data, error } = await supabase
    .from('organization_users')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    logger.error('Business goal reminder membership validation failed', {
      organizationId,
      userId,
      error,
    })
  }

  return { ok: Boolean(data && !error) }
}
