import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

export type AddMembershipErrorCode =
  | 'USER_NOT_FOUND'
  | 'ORGANIZATION_NOT_FOUND'
  | 'MEMBER_ALREADY_EXISTS'

export class AddMembershipError extends Error {
  constructor(public readonly code: AddMembershipErrorCode) {
    super(code)
    this.name = 'AddMembershipError'
  }
}

export interface AddUserMembershipInput {
  userId: string
  organizationId: string
  role: 'member' | 'admin' | 'owner'
  jobTitle: string | null
  invitedBy: string
}

export interface AddedMembership {
  membershipId: string
  organizationId: string
  role: string
  status: string
  reactivated: boolean
}

/**
 * Alta de membresía de organización desde el Panel Maestro del superadmin.
 * Si existe una membresía inactiva la reactiva; si ya está activa devuelve
 * un error tipado para que la ruta responda 409 sin tratarlo como fallo interno.
 */
export async function addUserMembership(input: AddUserMembershipInput): Promise<AddedMembership> {
  const supabase = createAdminClient()

  const [{ data: user }, { data: organization }] = await Promise.all([
    supabase.from('users').select('id').eq('id', input.userId).maybeSingle(),
    supabase.from('organizations').select('id').eq('id', input.organizationId).maybeSingle(),
  ])
  if (!user) throw new AddMembershipError('USER_NOT_FOUND')
  if (!organization) throw new AddMembershipError('ORGANIZATION_NOT_FOUND')

  const { data: existing, error: existingError } = await supabase
    .from('organization_users')
    .select('id, status')
    .eq('organization_id', input.organizationId)
    .eq('user_id', input.userId)
    .maybeSingle()

  if (existingError) {
    logger.error('Error checking existing membership:', existingError)
    throw existingError
  }

  if (existing?.status === 'active') {
    throw new AddMembershipError('MEMBER_ALREADY_EXISTS')
  }

  const now = new Date().toISOString()

  if (existing) {
    const { error: reactivateError } = await supabase
      .from('organization_users')
      .update({
        status: 'active',
        role: input.role,
        job_title: input.jobTitle,
        joined_at: now,
        updated_at: now,
      })
      .eq('id', existing.id)

    if (reactivateError) {
      logger.error('Error reactivating membership:', reactivateError)
      throw reactivateError
    }

    return {
      membershipId: existing.id,
      organizationId: input.organizationId,
      role: input.role,
      status: 'active',
      reactivated: true,
    }
  }

  const { data: created, error: insertError } = await supabase
    .from('organization_users')
    .insert({
      organization_id: input.organizationId,
      user_id: input.userId,
      role: input.role,
      job_title: input.jobTitle,
      status: 'active',
      invited_by: input.invitedBy,
      invited_at: now,
      joined_at: now,
    })
    .select('id')
    .single()

  if (insertError || !created) {
    logger.error('Error inserting membership:', insertError)
    throw insertError ?? new Error('Membership insert returned no row')
  }

  return {
    membershipId: created.id,
    organizationId: input.organizationId,
    role: input.role,
    status: 'active',
    reactivated: false,
  }
}
