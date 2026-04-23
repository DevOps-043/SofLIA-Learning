import { SupabaseClient } from '@supabase/supabase-js'
import { PROFESIONALES_COMMUNITY_SLUG } from '../../../community-policy.constants'
import { getCommunityBySlug, getUserRole } from './community'
import { ApiRouteResult } from './types'

const RESTRICTED_COMMUNITY_SLUG = PROFESIONALES_COMMUNITY_SLUG

export async function cleanupInvalidProfesionalesMemberships(
  supabase: SupabaseClient,
  slug: string,
  userId: string,
): Promise<ApiRouteResult> {
  // --- Authorization ---
  if (slug !== RESTRICTED_COMMUNITY_SLUG) {
    return { status: 400, body: { error: 'Esta operacion solo esta disponible para Profesionales' } }
  }

  if ((await getUserRole(supabase, userId)) !== 'admin') {
    return { status: 403, body: { error: 'Se requieren permisos de administrador' } }
  }

  // --- Data fetch ---
  const community = await getCommunityBySlug(supabase, slug)
  if (!community) return { status: 404, body: { error: 'Comunidad no encontrada' } }

  const { data: allMembers } = await supabase
    .from('community_members')
    .select('id, user_id')
    .eq('community_id', community.id)
    .eq('is_active', true)

  if (!allMembers || allMembers.length === 0) {
    return { status: 200, body: { success: true, message: 'No hay miembros para limpiar', removed: 0, valid_members: 0 } }
  }

  // --- Business logic ---
  const invalidMemberIds = await resolveInvalidProfesionalesMemberIds(supabase, community.id, allMembers)
  const validMemberCount = allMembers.length - invalidMemberIds.length

  // --- Writes (sequential, not atomic — TODO: move to a PostgreSQL RPC for atomicity) ---
  if (invalidMemberIds.length > 0) {
    const { error: deactivateError } = await supabase
      .from('community_members')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .in('id', invalidMemberIds)

    if (deactivateError) {
      console.error('[CleanupMemberships] Failed to deactivate invalid members', {
        communityId: community.id,
        invalidCount: invalidMemberIds.length,
        error: deactivateError.message,
      })
      return { status: 500, body: { error: 'Error al desactivar miembros invalidos' } }
    }
  }

  const { error: countUpdateError } = await supabase
    .from('communities')
    .update({ member_count: validMemberCount, updated_at: new Date().toISOString() })
    .eq('id', community.id)

  if (countUpdateError) {
    // Member deactivation succeeded but count is stale — log for reconciliation.
    // This is non-fatal for the user but requires attention.
    console.error('[CleanupMemberships] Member count sync failed after deactivation', {
      communityId: community.id,
      expectedCount: validMemberCount,
      error: countUpdateError.message,
    })
  }

  return {
    status: 200,
    body: {
      success: true,
      message: 'Limpieza completada exitosamente',
      removed: invalidMemberIds.length,
      valid_members: validMemberCount,
      total_checked: allMembers.length,
    },
  }
}

async function resolveInvalidProfesionalesMemberIds(
  supabase: SupabaseClient,
  communityId: string,
  allMembers: Array<{ id: string; user_id: string }>,
): Promise<string[]> {
  const memberUserIds = allMembers.map((member) => member.user_id)
  const { data } = await supabase
    .from('community_members')
    .select('user_id')
    .in('user_id', memberUserIds)
    .eq('is_active', true)
    .neq('community_id', communityId)

  const invalidUserIds = new Set((data ?? []).map((membership) => membership.user_id))
  return allMembers.filter((member) => invalidUserIds.has(member.user_id)).map((member) => member.id)
}
