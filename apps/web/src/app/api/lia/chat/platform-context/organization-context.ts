import { createClient } from '@/lib/supabase/server'
import type { ResolvedOrganizationContext } from '../organization-context.service'
import type { PlatformContext } from './context.types'
import type { UserOrganizationRow } from './row.types'

export function applyResolvedOrganizationContext(
  context: PlatformContext,
  organizationContext?: ResolvedOrganizationContext | null,
): void {
  if (!organizationContext) return

  context.organizationId = organizationContext.organizationId
  context.organizationName = organizationContext.organizationName
  context.organizationSlug = organizationContext.organizationSlug
  context.userJobTitle = organizationContext.userJobTitle
  context.userJobDescription = organizationContext.userJobDescription
  context.organizationIndustry = organizationContext.organizationIndustry
  context.organizationSize = organizationContext.organizationSize
  context.organizationType = organizationContext.organizationType
  context.organizationMission = organizationContext.organizationMission
  context.organizationCountry = organizationContext.organizationCountry
}

export async function loadLatestUserOrganizationContext(
  userId: string,
): Promise<ResolvedOrganizationContext | null> {
  const supabase = await createClient()
  const { data: userOrg } = await supabase
    .from('organization_users')
    .select('job_title, job_description, organizations!inner(id, name, slug, industry, company_size, company_type, company_mission, company_country)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const orgRow = userOrg as UserOrganizationRow | null
  if (!orgRow?.organizations?.id) return null

  return {
    organizationId: orgRow.organizations.id,
    organizationName: orgRow.organizations.name,
    organizationSlug: orgRow.organizations.slug,
    userJobTitle: orgRow.job_title || undefined,
    userJobDescription: orgRow.job_description || undefined,
    organizationIndustry: orgRow.organizations.industry || undefined,
    organizationSize: orgRow.organizations.company_size || undefined,
    organizationType: orgRow.organizations.company_type || undefined,
    organizationMission: orgRow.organizations.company_mission || undefined,
    organizationCountry: orgRow.organizations.company_country || undefined,
  }
}
