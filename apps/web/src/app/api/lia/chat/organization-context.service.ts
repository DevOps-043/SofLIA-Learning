import { createAdminClient } from '@/lib/supabase/admin'
import {
  extractOrganizationSlugFromPage,
  type ResolvedOrganizationAiContext,
} from '@/lib/lia-context/services/organization-ai-context.service'

export {
  createOrganizationAiContextRepository as createOrganizationContextRepository,
  extractOrganizationSlugFromPage,
  resolveActiveOrganizationAiContext as resolveActiveOrganizationContext,
} from '@/lib/lia-context/services/organization-ai-context.service'

export type {
  OrganizationAiContextRepository as OrganizationContextRepository,
  ResolvedOrganizationAiContext as ResolvedOrganizationContext,
} from '@/lib/lia-context/services/organization-ai-context.service'

/**
 * Resuelve la organización visible para un superadmin aunque no sea miembro.
 * Esta lectura no concede permisos; el grant privilegiado se revalida después
 * contra `users.platform_role` y queda ligado al tenant encontrado.
 */
export async function resolvePlatformAdminOrganizationContext(
  currentPage?: string,
): Promise<ResolvedOrganizationAiContext | null> {
  const slug = extractOrganizationSlugFromPage(currentPage)
  if (!slug || !currentPage?.includes(`/${slug}/business-panel`)) return null

  const { data, error } = await createAdminClient()
    .from('organizations')
    .select('id, name, slug, industry, company_size, company_type, company_mission, company_country')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) return null

  return {
    organizationId: data.id,
    organizationName: data.name,
    organizationSlug: data.slug,
    organizationIndustry: data.industry ?? undefined,
    organizationSize: data.company_size ?? undefined,
    organizationType: data.company_type ?? undefined,
    organizationMission: data.company_mission ?? undefined,
    organizationCountry: data.company_country ?? undefined,
  }
}
