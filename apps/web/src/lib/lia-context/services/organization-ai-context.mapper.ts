import { cleanOptional } from './organization-ai-context.clean'
import type {
  OrganizationMembershipRow,
  ResolvedOrganizationAiContext,
} from './organization-ai-context.types'

export function mapMembershipRow(
  row: OrganizationMembershipRow | null | undefined,
): ResolvedOrganizationAiContext | null {
  if (
    !row?.organizations?.id ||
    !row.organizations.name ||
    !row.organizations.slug
  ) {
    return null
  }

  return {
    organizationId: row.organizations.id,
    organizationName: row.organizations.name,
    organizationSlug: row.organizations.slug,
    userJobTitle: cleanOptional(row.job_title, 180),
    userJobDescription: cleanOptional(row.job_description, 600),
    organizationIndustry: cleanOptional(row.organizations.industry, 180),
    organizationSize: cleanOptional(row.organizations.company_size, 80),
    organizationType: cleanOptional(row.organizations.company_type, 120),
    organizationMission: cleanOptional(row.organizations.company_mission, 700),
    organizationCountry: cleanOptional(row.organizations.company_country, 120),
  }
}
