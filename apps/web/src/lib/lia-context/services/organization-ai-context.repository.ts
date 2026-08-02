import { mapMembershipRow } from './organization-ai-context.mapper'
import type {
  OrganizationAiContextRepository,
  OrganizationMembershipResponse,
  ResolvedOrganizationAiContext,
  SupabaseOrganizationAiContextClient,
} from './organization-ai-context.types'

const ORGANIZATION_CONTEXT_SELECT =
  'job_title, job_description, organizations!inner(id, name, slug, industry, company_size, company_type, company_mission, company_country)'

async function loadMembership(
  query: OrganizationMembershipResponse,
): Promise<ResolvedOrganizationAiContext | null> {
  const { data, error } = await query
  return error ? null : mapMembershipRow(data)
}

export function createOrganizationAiContextRepository(
  supabase: SupabaseOrganizationAiContextClient,
): OrganizationAiContextRepository {
  return {
    findMembershipByOrganizationId(userId, organizationId) {
      return loadMembership(
        supabase
          .from('organization_users')
          .select(ORGANIZATION_CONTEXT_SELECT)
          .eq('user_id', userId)
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .eq('organizations.is_active', true)
          .limit(1)
          .maybeSingle(),
      )
    },
    findMembershipByOrganizationSlug(userId, organizationSlug) {
      return loadMembership(
        supabase
          .from('organization_users')
          .select(ORGANIZATION_CONTEXT_SELECT)
          .eq('user_id', userId)
          .eq('status', 'active')
          .eq('organizations.slug', organizationSlug)
          .eq('organizations.is_active', true)
          .limit(1)
          .maybeSingle(),
      )
    },
    findLatestMembership(userId) {
      return loadMembership(
        supabase
          .from('organization_users')
          .select(ORGANIZATION_CONTEXT_SELECT)
          .eq('user_id', userId)
          .eq('status', 'active')
          .eq('organizations.is_active', true)
          .order('joined_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      )
    },
  }
}

export async function createDefaultOrganizationAiContextRepository() {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase =
    (await createClient()) as unknown as SupabaseOrganizationAiContextClient

  return createOrganizationAiContextRepository(supabase)
}
