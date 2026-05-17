import type {
  AdminSupabaseClient,
  DeleteUserRpcClient,
} from './delete-user.types'

export async function deleteUserViaRpc(
  adminSupabase: AdminSupabaseClient,
  userId: string,
) {
  const rpcClient = adminSupabase as unknown as DeleteUserRpcClient

  const { error } = await rpcClient.rpc('delete_user_cascade', {
    target_user_id: userId,
  })

  return !error
}
