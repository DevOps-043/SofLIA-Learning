import type { createAdminClient } from './client'

export type AdminSupabaseClient = ReturnType<typeof createAdminClient>

export interface UserIdRow {
  id: string
}

export type DeleteUserRpcClient = {
  rpc: (
    fn: string,
    args: { target_user_id: string },
  ) => Promise<{ data: unknown; error: unknown | null }>
}
