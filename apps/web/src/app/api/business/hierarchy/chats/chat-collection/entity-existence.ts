import { HierarchyChatsError } from './errors'
import type {
  CreateChatPayload,
  EntityType,
  HierarchyChatSupabaseClient,
} from './types'

const ENTITY_TABLES: Record<EntityType, string> = {
  region: 'organization_regions',
  zone: 'organization_zones',
  team: 'organization_teams',
  node: 'organization_nodes',
}

export async function assertHierarchyEntityExists(
  supabase: HierarchyChatSupabaseClient,
  payload: CreateChatPayload,
  organizationId: string,
) {
  const { data } = await supabase
    .from(ENTITY_TABLES[payload.entity_type])
    .select('id')
    .eq('id', payload.entity_id)
    .eq('organization_id', organizationId)
    .single()

  if (!data) {
    throw new HierarchyChatsError(404, {
      success: false,
      error: 'La entidad especificada no existe',
    })
  }
}
