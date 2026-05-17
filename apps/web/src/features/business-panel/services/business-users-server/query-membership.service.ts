import { fromLoose } from '../../../../lib/supabase/looseQuery'
import { createBusinessUsersAdminClient } from './client'
import type { MembershipRow } from './query.types'

export async function assertOrganizationUserMembership(
  organizationId: string,
  userId: string,
) {
  const supabase = createBusinessUsersAdminClient()
  const { data, error } = await fromLoose<MembershipRow>(
    supabase,
    'organization_users',
  )
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) {
    throw new Error('Usuario no pertenece a tu organizacion')
  }
}
