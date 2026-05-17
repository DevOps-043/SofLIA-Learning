import { createClient } from '../../../../lib/supabase/server'
import { resolveUserPrimaryMembership } from '../../../../lib/services/user-org-context.service'
import type { UserProfile } from '../../types/profile.types'
import { mapProfileWithMembership } from './profile-row.mapper'

export async function getProfile(
  userId: string,
  organizationId?: string | null,
): Promise<UserProfile> {
  const supabase = await createClient()
  const [profileResult, membership] = await Promise.all([
    supabase
      .from('users')
      .select('*')
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
