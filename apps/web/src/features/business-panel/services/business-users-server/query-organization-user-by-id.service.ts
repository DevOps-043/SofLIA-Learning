import { fromLoose } from '../../../../lib/supabase/looseQuery'
import type { BusinessUser } from '../businessUsers.service'
import { createBusinessUsersAdminClient } from './client'
import {
  BUSINESS_USER_SELECT,
  mapOrganizationUserRecord,
} from './helpers'
import type { OrganizationUserWithProfileRow } from './types'

export async function getOrganizationUserById(
  organizationId: string,
  userId: string,
): Promise<BusinessUser> {
  const supabase = createBusinessUsersAdminClient()
  const { data, error } = await fromLoose<OrganizationUserWithProfileRow>(
    supabase,
    'organization_users',
  )
    .select(BUSINESS_USER_SELECT)
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    throw new Error('Usuario no encontrado despues de actualizar')
  }

  const businessUser = mapOrganizationUserRecord(data)

  if (!businessUser) {
    throw new Error('Usuario no encontrado despues de actualizar')
  }

  return businessUser
}
