import { logger } from '../logger'
import { fromLoose } from '../supabase/looseQuery'
import { createClient } from '../supabase/server'

interface CommunityPermissionCommunityRow {
  creator_id: string | null
}

interface CommunityPermissionMemberRow {
  is_active?: boolean | null
  role: string
  user_id: string
}

function communitiesTable(client: unknown) {
  return fromLoose<CommunityPermissionCommunityRow>(client, 'communities')
}

function communityMembersTable(client: unknown) {
  return fromLoose<CommunityPermissionMemberRow>(client, 'community_members')
}

function normalizeRole(role: string | null | undefined): string {
  return role?.trim().toLowerCase() ?? ''
}

function isNoRowsError(error: { code?: string } | null): boolean {
  return error?.code === 'PGRST116'
}

/**
 * Verifica si un usuario puede gestionar solicitudes de acceso a una comunidad.
 *
 * Un usuario puede gestionar solicitudes si:
 * 1. Es Administrador
 * 2. Es Instructor y es admin de la comunidad
 * 3. Es Instructor y es el creador de la comunidad
 */
export async function canManageCommunityAccessRequests(
  userId: string,
  communityId: string
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, cargo_rol')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      logger.error('Error fetching user for community permissions', {
        error: userError,
        userId,
      })
      return false
    }

    const normalizedRole = normalizeRole(user.cargo_rol)
    if (normalizedRole === 'administrador') {
      return true
    }

    if (normalizedRole !== 'instructor') {
      return false
    }

    const { data: community, error: communityError } = await communitiesTable(supabase)
      .select('creator_id')
      .eq('id', communityId)
      .single()

    if (communityError || !community) {
      logger.error('Error fetching community for permissions', {
        communityId,
        error: communityError,
      })
      return false
    }

    if (community.creator_id === userId) {
      return true
    }

    const { data: membership, error: membershipError } = await communityMembersTable(supabase)
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (membershipError && !isNoRowsError(membershipError)) {
      logger.error('Error fetching community membership', {
        communityId,
        error: membershipError,
        userId,
      })
      return false
    }

    return membership?.role === 'admin'
  } catch (error) {
    logger.error('Error in canManageCommunityAccessRequests', {
      error,
      communityId,
      userId,
    })
    return false
  }
}

/**
 * Obtiene los usuarios que deben recibir notificaciones cuando se crea una
 * solicitud de acceso.
 */
export async function getUsersToNotifyForAccessRequest(
  communityId: string
): Promise<string[]> {
  try {
    const supabase = await createClient()
    const userIds: string[] = []

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, cargo_rol, is_banned')
      .eq('is_banned', false)

    if (!usersError && users) {
      const adminIds = users
        .filter((user) => normalizeRole(user.cargo_rol) === 'administrador')
        .map((user) => user.id)

      userIds.push(...adminIds)
    }

    const { data: community, error: communityError } = await communitiesTable(supabase)
      .select('creator_id')
      .eq('id', communityId)
      .single()

    if (communityError || !community) {
      logger.error('Error fetching community for notifications', {
        communityId,
        error: communityError,
      })
      return [...new Set(userIds)]
    }

    if (community.creator_id) {
      const { data: creator, error: creatorError } = await supabase
        .from('users')
        .select('id, cargo_rol')
        .eq('id', community.creator_id)
        .single()

      if (!creatorError && creator && normalizeRole(creator.cargo_rol) === 'instructor') {
        if (!userIds.includes(creator.id)) {
          userIds.push(creator.id)
        }
      }
    }

    const { data: adminMembers, error: adminMembersError } = await communityMembersTable(supabase)
      .select('user_id')
      .eq('community_id', communityId)
      .eq('role', 'admin')
      .eq('is_active', true)

    if (adminMembersError) {
      logger.error('Error fetching community admin members', {
        communityId,
        error: adminMembersError,
      })
      return [...new Set(userIds)]
    }

    const memberIds = [...new Set((adminMembers ?? []).map((member) => member.user_id))]
    if (memberIds.length === 0) {
      return [...new Set(userIds)]
    }

    const { data: memberUsers, error: memberUsersError } = await supabase
      .from('users')
      .select('id, cargo_rol')
      .in('id', memberIds)

    if (memberUsersError) {
      logger.error('Error fetching community admin users', {
        communityId,
        error: memberUsersError,
      })
      return [...new Set(userIds)]
    }

    for (const memberUser of memberUsers ?? []) {
      if (normalizeRole(memberUser.cargo_rol) !== 'instructor') {
        continue
      }

      if (!userIds.includes(memberUser.id)) {
        userIds.push(memberUser.id)
      }
    }

    return [...new Set(userIds)]
  } catch (error) {
    logger.error('Error in getUsersToNotifyForAccessRequest', {
      communityId,
      error,
    })
    return []
  }
}

/**
 * Verifica si un usuario puede moderar una comunidad.
 */
export async function canModerateCommunity(
  userId: string,
  communityId: string
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, cargo_rol')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      logger.error('Error fetching user for moderation permissions', {
        error: userError,
        userId,
      })
      return false
    }

    if (normalizeRole(user.cargo_rol) === 'administrador') {
      return true
    }

    const { data: community, error: communityError } = await communitiesTable(supabase)
      .select('creator_id')
      .eq('id', communityId)
      .single()

    if (communityError || !community) {
      logger.error('Error fetching community for moderation permissions', {
        communityId,
        error: communityError,
      })
      return false
    }

    if (community.creator_id === userId) {
      return true
    }

    const { data: membership, error: membershipError } = await communityMembersTable(supabase)
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (membershipError && !isNoRowsError(membershipError)) {
      logger.error('Error fetching community membership for moderation', {
        communityId,
        error: membershipError,
        userId,
      })
      return false
    }

    return membership?.role === 'admin' || membership?.role === 'moderator'
  } catch (error) {
    logger.error('Error in canModerateCommunity', {
      communityId,
      error,
      userId,
    })
    return false
  }
}
