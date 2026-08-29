import { createAdminClient } from '../../../../lib/supabase/admin'
import { resolveUserPrimaryMembership } from '../../../../lib/services/user-org-context.service'
import type { UserProfile } from '../../types/profile.types'
import { mapProfileWithMembership } from './profile-row.mapper'
import { PROFILE_USER_SELECT } from './profile-selects'

export async function getProfile(
  userId: string,
  organizationId?: string | null,
): Promise<UserProfile> {
  // Authentication is resolved by the API before this service receives the
  // user id. Use the server client so legacy sessions do not lose their user
  // context when the profile query is evaluated through RLS.
  const supabase = createAdminClient()
  const [profileResult, membership] = await Promise.all([
    supabase
      .from('users')
      .select(PROFILE_USER_SELECT)
      .eq('id', userId)
      .single(),
    resolveUserPrimaryMembership(supabase, userId, organizationId),
  ])
  const { data, error } = profileResult

  if (error) {
    throw new Error(`Error al obtener perfil: ${error.message}`)
  }

  if (!data) {
    throw new Error('Perfil no encontrado')
  }

  return mapProfileWithMembership(data, membership)
}
