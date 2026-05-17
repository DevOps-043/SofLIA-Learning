import { fromLoose } from '../../../../lib/supabase/looseQuery'
import type { BusinessUser } from '../businessUsers.service'
import { createBusinessUsersAdminClient } from './client'
import {
  BUSINESS_USER_SELECT,
  mapOrganizationUserRecord,
} from './helpers'
import type { OrganizationUserWithProfileRow } from './types'

export async function getOrganizationUsers(
  organizationId: string,
): Promise<BusinessUser[]> {
  const supabase = createBusinessUsersAdminClient()
  const { data, error } = await fromLoose<OrganizationUserWithProfileRow>(
    supabase,
    'organization_users',
  )
    .select(BUSINESS_USER_SELECT)
    .eq('organization_id', organizationId)
    .order('joined_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? [])
    .map(mapOrganizationUserRecord)
    .filter((user): user is BusinessUser => user !== null)
}
