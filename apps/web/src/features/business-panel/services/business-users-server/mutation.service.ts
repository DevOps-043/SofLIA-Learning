import bcrypt from 'bcryptjs'
import { fromLoose } from '../../../../lib/supabase/looseQuery'
import type {
  BusinessUser,
  CreateBusinessUserRequest,
  UpdateBusinessUserRequest,
} from '../businessUsers.service'
import { createBusinessUsersAdminClient } from './client'
import {
  buildOrganizationUserInsertData,
  buildOrganizationUserUpdateData,
  buildUserInsertData,
  buildUserUpdateData,
  hasHierarchyAutoAssignEnabled,
  mapCreateOrganizationUserError,
  shouldAutoAssignToDefaultTeam,
  validateCreateBusinessUserRequest,
} from './helpers'
import {
  assertOrganizationUserMembership,
  getOrganizationUserById,
} from './query.service'
import type {
  OrganizationHierarchyRow,
  OrganizationNodeRow,
  UserInsertRow,
  UserUpdateRow,
} from './types'

type CreatedUserRow = {
  id: string
}

async function maybeAutoAssignUserToDefaultTeam(
  organizationId: string,
  userId: string,
  role: BusinessUser['org_role'] | undefined,
) {
  if (!shouldAutoAssignToDefaultTeam(role)) {
    return
  }

  const supabase = createBusinessUsersAdminClient()

  try {
    const { data: organization } = await fromLoose<OrganizationHierarchyRow>(
      supabase,
      'organizations',
    )
      .select('hierarchy_enabled, hierarchy_config')
      .eq('id', organizationId)
      .maybeSingle()

    if (
      !organization?.hierarchy_enabled ||
      !hasHierarchyAutoAssignEnabled(organization.hierarchy_config)
    ) {
      return
    }

    const { data: defaultTeam } = await fromLoose<OrganizationNodeRow>(
      supabase,
      'organization_nodes',
    )
      .select('id')
      .eq('organization_id', organizationId)
      .eq('type', 'team')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!defaultTeam) {
      return
    }

    await fromLoose(supabase, 'organization_node_users').insert({
      node_id: defaultTeam.id,
      user_id: userId,
      role: 'member',
      is_primary: true,
    })
  } catch {
    // La autoasignacion no debe bloquear la creacion del usuario.
  }
}

export async function createOrganizationUser(
  organizationId: string,
  userData: CreateBusinessUserRequest,
  createdBy: string,
): Promise<BusinessUser> {
  const supabase = createBusinessUsersAdminClient()

  try {
    validateCreateBusinessUserRequest(userData)

    const passwordHash = await bcrypt.hash(userData.password.trim(), 10)
    const userInsertData = buildUserInsertData(
      userData,
      passwordHash,
    ) satisfies UserInsertRow

    const { data: newUser, error: userError } = await fromLoose<
      CreatedUserRow,
      UserInsertRow
    >(supabase, 'users')
      .insert(userInsertData)
      .select('id')
      .single()

    if (userError || !newUser) {
      throw userError ?? new Error('No se pudo crear el usuario')
    }

    const nowIso = new Date().toISOString()
    const { error: organizationUserError } = await fromLoose(
      supabase,
      'organization_users',
    ).insert(
      buildOrganizationUserInsertData(
        organizationId,
        newUser.id,
        userData,
        createdBy,
        nowIso,
      ),
    )

    if (organizationUserError) {
      await fromLoose(supabase, 'users').delete().eq('id', newUser.id)
      throw organizationUserError
    }

    await maybeAutoAssignUserToDefaultTeam(
      organizationId,
      newUser.id,
      userData.org_role,
    )

    return getOrganizationUserById(organizationId, newUser.id)
  } catch (error) {
    const mappedError = mapCreateOrganizationUserError(error)
    throw mappedError ?? error
  }
}

export async function updateOrganizationUser(
  organizationId: string,
  userId: string,
  userData: UpdateBusinessUserRequest,
): Promise<BusinessUser> {
  await assertOrganizationUserMembership(organizationId, userId)

  const supabase = createBusinessUsersAdminClient()
  const userUpdateData = buildUserUpdateData(userData) satisfies UserUpdateRow
  const organizationUpdateData = buildOrganizationUserUpdateData(userData)

  if (Object.keys(userUpdateData).length > 0) {
    const { error } = await fromLoose(supabase, 'users')
      .update(userUpdateData)
      .eq('id', userId)

    if (error) {
      throw error
    }
  }

  if (Object.keys(organizationUpdateData).length > 0) {
    const { error } = await fromLoose(supabase, 'organization_users')
      .update(organizationUpdateData)
      .eq('organization_id', organizationId)
      .eq('user_id', userId)

    if (error) {
      throw error
    }
  }

  return getOrganizationUserById(organizationId, userId)
}

async function updateMembershipStatus(
  organizationId: string,
  userId: string,
  status: 'active' | 'suspended',
) {
  await assertOrganizationUserMembership(organizationId, userId)

  const supabase = createBusinessUsersAdminClient()
  const { error } = await fromLoose(supabase, 'organization_users')
    .update({ status })
    .eq('organization_id', organizationId)
    .eq('user_id', userId)

  if (error) {
    throw error
  }
}

export async function resendInvitation(
  organizationId: string,
  userId: string,
): Promise<void> {
  await assertOrganizationUserMembership(organizationId, userId)

  const supabase = createBusinessUsersAdminClient()
  const { error } = await fromLoose(supabase, 'organization_users')
    .update({ invited_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .eq('user_id', userId)

  if (error) {
    throw error
  }
}

export async function suspendUser(
  organizationId: string,
  userId: string,
): Promise<void> {
  await updateMembershipStatus(organizationId, userId, 'suspended')
}

export async function activateUser(
  organizationId: string,
  userId: string,
): Promise<void> {
  await updateMembershipStatus(organizationId, userId, 'active')
}
