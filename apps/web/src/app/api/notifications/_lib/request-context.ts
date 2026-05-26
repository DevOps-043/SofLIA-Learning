import { SessionService } from '@/features/auth/services/session.service'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

type NotificationSupabaseClient = Awaited<
  ReturnType<typeof createServerSupabaseClient>
>

interface NotificationRequestContext {
  supabase: NotificationSupabaseClient
  userId: string
}

export async function resolveNotificationRequestContext(): Promise<NotificationRequestContext | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (authUser?.id) {
    return {
      supabase,
      userId: authUser.id,
    }
  }

  const sessionUser = await SessionService.getCurrentUser()
  if (!sessionUser) {
    return null
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY no esta configurada para sesiones legacy',
    )
  }

  return {
    supabase: createAdminClient() as unknown as NotificationSupabaseClient,
    userId: sessionUser.id,
  }
}
