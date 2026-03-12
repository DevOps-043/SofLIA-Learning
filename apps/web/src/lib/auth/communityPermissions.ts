import { createClient } from '../supabase/server'
import { logger } from '../logger'

/**
 * Verifica si un usuario puede gestionar solicitudes de acceso a una comunidad.
 * 
 * Un usuario puede gestionar solicitudes si:
 * 1. Es Administrador (cargo_rol = 'Administrador')
 * 2. Es Instructor Y es admin de la comunidad (role = 'admin' en community_members)
 * 3. Es Instructor Y es el creador de la comunidad (creator_id = user_id)
 * 
 * @param userId - ID del usuario
 * @param communityId - ID de la comunidad
 * @returns true si el usuario puede gestionar solicitudes, false en caso contrario
 */
export async function canManageCommunityAccessRequests(
  userId: string,
  communityId: string
): Promise<boolean> {
  try {
    const supabase = await createClient()

    // 1. Obtener información del usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, cargo_rol')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      logger.error('Error fetching user for community permissions', { userId, error: userError })
      return false
    }

    // 2. Si es Administrador, puede gestionar cualquier comunidad
    const normalizedRole = user.cargo_rol?.toLowerCase().trim();
    if (normalizedRole === 'administrador') {
      return true
    }

    // 3. Si es Instructor, verificar si es admin de la comunidad o creador
    if (normalizedRole === 'instructor') {
      // Obtener información de la comunidad
      const { data: community, error: communityError } = await supabase
        .from('communities')
        .select('creator_id')
        .eq('id', communityId)
        .single()

      if (communityError || !community) {
        logger.error('Error fetching community for permissions', { communityId, error: communityError })
        return false
      }

      // Verificar si es el creador de la comunidad
      if (community.creator_id === userId) {
        return true
      }

      // Verificar si es admin de la comunidad
      const { data: membership, error: membershipError } = await supabase
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (membershipError && membershipError.code !== 'PGRST116') {
        logger.error('Error fetching community membership', { userId, communityId, error: membershipError })
        return false
      }

      // Si es admin de la comunidad, puede gestionar
      if (membership && membership.role === 'admin') {
        return true
      }
    }

    // Si no cumple ninguna condición, no puede gestionar
    return false
  } catch (error) {
    logger.error('Error in canManageCommunityAccessRequests', error)
    return false
  }
}

/**
 * Obtiene los usuarios que deben recibir notificaciones cuando se crea una solicitud de acceso.
 * 
 * Retorna:
 * - Todos los Administradores
 * - Instructores que son admin de la comunidad
 * - El instructor que creó la comunidad
 * 
 * @param communityId - ID de la comunidad
 * @returns Array de IDs de usuarios que deben recibir notificaciones
 */
export async function getUsersToNotifyForAccessRequest(
  communityId: string
): Promise<string[]> {
  try {
    const supabase = await createClient()
    const userIds: string[] = []

    // 1. Obtener todos los Administradores
    const { data: admins, error: adminsError } = await supabase
      .from('users')
      .select('id, cargo_rol')
      .eq('is_banned', false)

    if (!adminsError && admins) {
      // Filtrar administradores de forma insensible a mayúsculas
      const adminIds = admins
        .filter((u: { cargo_rol: string | null }) => u.cargo_rol?.toLowerCase().trim() === 'administrador')
        .map((u: { id: string }) => u.id);
      userIds.push(...adminIds)
    }

    // 2. Obtener información de la comunidad (creator_id)
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('creator_id')
      .eq('id', communityId)
      .single()

    if (communityError || !community) {
      logger.error('Error fetching community for notifications', { communityId, error: communityError })
      return userIds
    }

    // 3. Si hay un creador y es Instructor, agregarlo
    if (community.creator_id) {
      const { data: creator, error: creatorError } = await supabase
        .from('users')
        .select('id, cargo_rol')
        .eq('id', community.creator_id)
        .single()

      if (!creatorError && creator && creator.cargo_rol?.toLowerCase().trim() === 'instructor') {
        // Solo agregar si no está ya en la lista (por si es admin)
        if (!userIds.includes(creator.id)) {
          userIds.push(creator.id)
        }
      }
    }

    // 4. Obtener Instructores que son admin de la comunidad
    const { data: adminMembers, error: adminMembersError } = await supabase
      .from('community_members')
      .select('user_id')
      .eq('community_id', communityId)
      .eq('role', 'admin')
      .eq('is_active', true)

    if (!adminMembersError && adminMembers) {
      // Verificar que sean Instructores
      for (const member of adminMembers) {
        const { data: memberUser, error: memberUserError } = await supabase
          .from('users')
          .select('id, cargo_rol')
          .eq('id', member.user_id)
          .single()

        if (!memberUserError && memberUser && memberUser.cargo_rol?.toLowerCase().trim() === 'instructor') {
          // Solo agregar si no está ya en la lista
          if (!userIds.includes(memberUser.id)) {
            userIds.push(memberUser.id)
          }
        }
      }
    }

    // Eliminar duplicados
    return [...new Set(userIds)]
  } catch (error) {
    logger.error('Error in getUsersToNotifyForAccessRequest', error)
    return []
  }
}

/**
 * Verifica si un usuario puede moderar una comunidad (ver y gestionar reportes).
 * 
 * Un usuario puede moderar si:
 * 1. Es Administrador (cargo_rol = 'Administrador')
 * 2. Es el creador de la comunidad (creator_id = user_id)
 * 3. Es admin o moderador de la comunidad (role = 'admin' o 'moderator' en community_members)
 * 
 * @param userId - ID del usuario
 * @param communityId - ID de la comunidad
 * @returns true si el usuario puede moderar, false en caso contrario
 */
export async function canModerateCommunity(
  userId: string,
  communityId: string
): Promise<boolean> {
  try {
    const supabase = await createClient()

    // 1. Obtener información del usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, cargo_rol')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      logger.error('Error fetching user for moderation permissions', { userId, error: userError })
      return false
    }

    // 2. Si es Administrador, puede moderar cualquier comunidad
    const normalizedRole = user.cargo_rol?.toLowerCase().trim();
    if (normalizedRole === 'administrador') {
      return true
    }

    // 3. Obtener información de la comunidad
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('creator_id')
      .eq('id', communityId)
      .single()

    if (communityError || !community) {
      logger.error('Error fetching community for moderation permissions', { communityId, error: communityError })
      return false
    }

    // 4. Si es el creador de la comunidad, puede moderar
    if (community.creator_id === userId) {
      return true
    }

    // 5. Verificar si es admin o moderador de la comunidad
    const { data: membership, error: membershipError } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (membershipError && membershipError.code !== 'PGRST116') {
      logger.error('Error fetching community membership for moderation', { userId, communityId, error: membershipError })
      return false
    }

    // Si es admin o moderador de la comunidad, puede moderar
    if (membership && (membership.role === 'admin' || membership.role === 'moderator')) {
      return true
    }

    // Si no cumple ninguna condición, no puede moderar
    return false
  } catch (error) {
    logger.error('Error in canModerateCommunity', error)
    return false
  }
}

