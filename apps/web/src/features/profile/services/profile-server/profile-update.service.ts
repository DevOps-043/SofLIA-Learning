import { createClient } from '../../../../lib/supabase/server'
import { resolveUserPrimaryMembership } from '../../../../lib/services/user-org-context.service'
import type {
  UpdateProfileRequest,
  UserProfile,
} from '../../types/profile.types'
import {
  pickAllowedOrganizationProfileUpdates,
  pickAllowedProfileUpdates,
  resolveChangedOrganizationProfileFields,
  resolveChangedProfileFields,
} from '../profile.shared'
import { mapProfileWithMembership } from './profile-row.mapper'
import { PROFILE_USER_SELECT } from './profile-selects'
import type { ProfileMembership } from './profile-server.types'
import { notifyProfileUpdatedBestEffort } from './profile-update-notification.service'

export async function updateProfile(
  userId: string,
  updates: UpdateProfileRequest,
  organizationId?: string | null,
): Promise<UserProfile> {
  const supabase = await createClient()
  const [oldProfileResult, oldMembership] = await Promise.all([
    supabase.from('users').select(PROFILE_USER_SELECT).eq('id', userId).single(),
    resolveUserPrimaryMembership(supabase, userId, organizationId),
  ])
  const { data: oldData, error: oldDataError } = oldProfileResult

  if (oldDataError) throw new Error(`Error al obtener perfil actual: ${oldDataError.message}`)
  if (!oldData) throw new Error('Perfil no encontrado')

  const safeUpdates = pickAllowedProfileUpdates(updates)
  const organizationUpdates = pickAllowedOrganizationProfileUpdates(updates)
  const actualChanges = resolveChangedProfileFields(oldData, safeUpdates)
  const organizationChanges = resolveChangedOrganizationProfileFields(oldMembership, organizationUpdates)

  if (actualChanges.length === 0 && organizationChanges.length === 0) {
    return mapProfileWithMembership(oldData, oldMembership)
  }

  let nextProfile = oldData
  let nextMembership: ProfileMembership | null = oldMembership
  const now = new Date().toISOString()

  if (actualChanges.length > 0) {
    const { data, error } = await supabase
      .from('users')
      .update({ ...safeUpdates, updated_at: now })
      .eq('id', userId)
      .select(PROFILE_USER_SELECT)
      .single()

    if (error) throw new Error(`Error al actualizar perfil: ${error.message}`)
    if (!data) throw new Error('Error al actualizar perfil')
    nextProfile = data
  }

  if (organizationChanges.length > 0) {
    if (!oldMembership?.id) {
      throw new Error('No se encontro una membresia activa para actualizar el rol laboral')
    }

    const { data, error } = await supabase
      .from('organization_users')
      .update({ ...organizationUpdates, updated_at: now })
      .eq('id', oldMembership.id)
      .eq('user_id', userId)
      .select('id, job_title, job_description')
      .single()

    if (error) throw new Error(`Error al actualizar datos laborales: ${error.message}`)
    nextMembership = data as ProfileMembership | null
  }

  await notifyProfileUpdatedBestEffort(userId, [...actualChanges, ...organizationChanges])

  return mapProfileWithMembership(nextProfile, nextMembership)
}
