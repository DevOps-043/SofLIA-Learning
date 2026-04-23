import { SupabaseClient } from '@supabase/supabase-js'
import { CommunityRecord } from './types'

export async function getCommunityBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<CommunityRecord | null> {
  const { data } = await supabase
    .from('communities')
    .select('id, name, slug, access_type')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  return (data as CommunityRecord | null) ?? null
}

export async function getUserRole(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.from('users').select('role').eq('id', userId).single()
  return data?.role ?? null
}
