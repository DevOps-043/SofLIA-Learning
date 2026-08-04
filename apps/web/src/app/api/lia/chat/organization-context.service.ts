import { createAdminClient } from '@/lib/supabase/admin'
import { isPlatformAdminRole } from '@/lib/auth/platform-role'
import {
  extractOrganizationSlugFromPage,
  resolveActiveOrganizationAiContext,
  type OrganizationAiContextRepository,
  type ResolvedOrganizationAiContext,
} from '@/lib/lia-context/services/organization-ai-context.service'
import { isOrganizationAdminPanelPage } from './superadmin/authorization'

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

/**
 * Organización que gobierna un turno del chat de SofLIA.
 *
 * Precedencia:
 *  1. Membresía del usuario en la organización que fija la ruta activa (o, en
 *     rutas sin slug, la pedida por el cliente / su membresía más reciente).
 *  2. Lectura privilegiada del superadmin, que solo cubre
 *     `/[slug]/business-panel` y sirve para que administre organizaciones
 *     ajenas sin ser miembro.
 *
 * La lectura privilegiada solo puede AÑADIR contexto, nunca quitarlo: cuando no
 * aplica se conserva la membresía ya resuelta. Sobrescribirla con su `null`
 * dejaba al superadmin sin tenant en sus propias páginas de `business-user`, y
 * el prompt terminaba adoptando otra de sus organizaciones como empleador.
 */
export async function resolveChatOrganizationContext(params: {
  currentPage?: string
  platformRole?: string | null
  repository?: OrganizationAiContextRepository
  requestedOrganizationId?: string
  userId?: string
}): Promise<ResolvedOrganizationAiContext | null> {
  const membershipContext = await resolveActiveOrganizationAiContext({
    currentPage: params.currentPage,
    repository: params.repository,
    requestedOrganizationId: params.requestedOrganizationId,
    userId: params.userId,
  })

  const alreadyOnOwnAdminPanel =
    membershipContext !== null &&
    isOrganizationAdminPanelPage(
      params.currentPage,
      membershipContext.organizationSlug,
    )

  if (!isPlatformAdminRole(params.platformRole) || alreadyOnOwnAdminPanel) {
    return membershipContext
  }

  const platformAdminContext = await resolvePlatformAdminOrganizationContext(
    params.currentPage,
  )

  return platformAdminContext ?? membershipContext
}
