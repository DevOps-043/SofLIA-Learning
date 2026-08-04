export interface ResolvedOrganizationAiContext {
  organizationId: string
  organizationName: string
  organizationSlug: string
  userJobTitle?: string
  userJobDescription?: string
  organizationIndustry?: string
  organizationSize?: string
  organizationType?: string
  organizationMission?: string
  organizationCountry?: string
}

export interface OrganizationAiContextRepository {
  findMembershipByOrganizationId: (
    userId: string,
    organizationId: string,
  ) => Promise<ResolvedOrganizationAiContext | null>
  findMembershipByOrganizationSlug: (
    userId: string,
    organizationSlug: string,
  ) => Promise<ResolvedOrganizationAiContext | null>
  findLatestMembership: (
    userId: string,
  ) => Promise<ResolvedOrganizationAiContext | null>
}

export interface OrganizationAiContextPromptOptions {
  enabled?: boolean
  focus?: string[]
  instructions?: string
}

export interface OrganizationMembershipRow {
  job_title: string | null
  job_description: string | null
  organizations: {
    id: string
    name: string
    slug: string
    industry: string | null
    company_size: string | null
    company_type: string | null
    company_mission: string | null
    company_country: string | null
  } | null
}

export interface OrganizationMembershipResponse
  extends PromiseLike<{
    data: OrganizationMembershipRow | null
    error: { message?: string } | null
  }> {}

export interface OrganizationMembershipQueryBuilder
  extends OrganizationMembershipResponse {
  eq: (
    column: string,
    value: string | boolean,
  ) => OrganizationMembershipQueryBuilder
  order: (
    column: string,
    options: { ascending: boolean; nullsFirst?: boolean },
  ) => OrganizationMembershipQueryBuilder
  limit: (value: number) => OrganizationMembershipQueryBuilder
  maybeSingle: () => OrganizationMembershipResponse
}

export interface SupabaseOrganizationAiContextClient {
  from: (table: 'organization_users') => {
    select: (query: string) => OrganizationMembershipQueryBuilder
  }
}
