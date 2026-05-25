import type { BusinessAuth, CreateChatParams, HierarchyChatSupabase } from './types';

const ENTITY_TABLE_BY_TYPE = {
  region: 'organization_regions',
  zone: 'organization_zones',
  team: 'organization_teams',
  node: 'organization_nodes',
} as const;

export async function hierarchyEntityExists({
  auth,
  entity_id,
  entity_type,
  supabase,
}: Pick<CreateChatParams, 'entity_id' | 'entity_type'> & {
  auth: BusinessAuth;
  supabase: HierarchyChatSupabase;
}) {
  const { data } = await supabase
    .from(ENTITY_TABLE_BY_TYPE[entity_type])
    .select('id')
    .eq('id', entity_id)
    .eq('organization_id', auth.organizationId)
    .single();

  return Boolean(data);
}

export function getLevelRole(
  entityType: CreateChatParams['entity_type'],
  chatType: CreateChatParams['chat_type'],
) {
  if (entityType === 'region') return 'regional_manager';
  if (entityType === 'zone') return 'zone_manager';
  if (entityType === 'team') return 'team_leader';
  if (entityType === 'node' && chatType === 'vertical') return 'node_manager';
  return null;
}
