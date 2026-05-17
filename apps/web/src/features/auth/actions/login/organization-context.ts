import type { LoginSupabaseClient, LoginUserRecord } from './types'
import { handleNoBelongingRedirect } from './organization-helpers'

const allowedPlans = ['team', 'business', 'enterprise', 'pro', 'premium', 'basic']
const activeStatuses = ['active', 'trial', 'trialing']

export async function validateCustomOrganizationLogin(input: {
  formData: FormData
  supabase: LoginSupabaseClient
  user: LoginUserRecord
}) {
  const organizationId = input.formData.get('organizationId')?.toString()
  const organizationSlug = input.formData.get('organizationSlug')?.toString()

  if (!organizationId || !organizationSlug) {
    return null
  }

  const validation = await validateOrganizationAccess(
    input.supabase,
    organizationId,
    organizationSlug
  )
  if (validation) {
    return validation
  }

  const { data: orgUser } = await input.supabase
    .from('organization_users')
    .select('organization_id, joined_at')
    .eq('user_id', input.user.id)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .single()

  if (orgUser) {
    return null
  }

  const joined = await tryConsumeOrganizationInvitation(input, organizationId)
  return joined
    ? null
    : handleNoBelongingRedirect(input.supabase, input.user, organizationId)
}

async function validateOrganizationAccess(
  supabase: LoginSupabaseClient,
  organizationId: string,
  organizationSlug: string
) {
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('id, slug, subscription_plan, subscription_status, is_active')
    .eq('id', organizationId)
    .eq('slug', organizationSlug)
    .single()

  if (orgError || !organization) {
    return { error: 'Organizacion no encontrada' }
  }

  const planOk =
    !organization.subscription_plan ||
    allowedPlans.includes(organization.subscription_plan)
  const statusOk =
    !organization.subscription_status ||
    activeStatuses.includes(organization.subscription_status)
  const isActiveOk =
    organization.is_active === undefined ||
    organization.is_active === null ||
    organization.is_active === true

  return !planOk || !statusOk || !isActiveOk
    ? { error: 'Esta organizacion no tiene acceso a login personalizado' }
    : null
}

async function tryConsumeOrganizationInvitation(
  input: {
    formData: FormData
    supabase: LoginSupabaseClient
    user: LoginUserRecord
  },
  organizationId: string
): Promise<boolean> {
  const invitationToken = input.formData.get('invitationToken')?.toString()
  const bulkInviteToken = input.formData.get('bulkInviteToken')?.toString()

  if (!invitationToken && !bulkInviteToken) {
    return false
  }

  const { consumeInvitationAction, consumeBulkInvitationAction } = await import(
    '../invitation'
  )

  const consumeResult = invitationToken
    ? await consumeInvitationAction(invitationToken, organizationId, input.user.id)
    : await consumeBulkInvitationAction(bulkInviteToken as string, input.user.id)

  if (!consumeResult?.success) {
    console.warn(
      '[loginAction] Fallo el consumo de invitacion:',
      consumeResult?.error
    )
  }

  return Boolean(consumeResult?.success)
}
