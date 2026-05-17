import { AutoNotificationsService } from '@/features/notifications/services/auto-notifications.service'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

export async function notifyOrganizationUsersPathAssigned(
  supabase: AdminClient,
  organizationId: string,
  learningPathId: string,
  pathTitle: string,
) {
  try {
    const { data: orgUsers } = await fromLoose<{ user_id: string }>(supabase, 'organization_users')
      .select('user_id')
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    if (!orgUsers || orgUsers.length === 0) return

    const batchSize = 50
    for (let i = 0; i < orgUsers.length; i += batchSize) {
      const batch = orgUsers.slice(i, i + batchSize)
      await Promise.allSettled(
        batch.map((user) =>
          AutoNotificationsService.notifyPathAssigned(
            user.user_id,
            organizationId,
            learningPathId,
            pathTitle,
          ),
        ),
      )
    }
  } catch (notificationError) {
    logger.error('Error enviando notificaciones masivas de ruta:', notificationError)
  }
}
