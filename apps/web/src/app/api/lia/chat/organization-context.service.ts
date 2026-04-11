interface OrganizationMembershipRow {
  job_title: string | null
  organizations: {
    id: string
    name: string
    slug: string
  } | null
}

export interface ResolvedOrganizationContext {
  organizationId: string
  organizationName: string
  organizationSlug: string
  userJobTitle?: string
}

export interface OrganizationContextRepository {
  findMembershipByOrganizationId: (
    userId: string,
    organizationId: string,
  ) => Promise<ResolvedOrganizationContext | null>
  findMembershipByOrganizationSlug: (
    userId: string,
    organizationSlug: string,
  ) => Promise<ResolvedOrganizationContext | null>
  findLatestMembership: (userId: string) => Promise<ResolvedOrganizationContext | null>
}

interface OrganizationMembershipResponse
  extends PromiseLike<{
    data: OrganizationMembershipRow | null
    error: unknown
  }> {}

interface OrganizationMembershipQueryBuilder extends OrganizationMembershipResponse {
  eq: (column: string, value: string) => OrganizationMembershipQueryBuilder
  order: (
    column: string,
    options: { ascending: boolean },
  ) => OrganizationMembershipQueryBuilder
  limit: (value: number) => OrganizationMembershipQueryBuilder
  maybeSingle: () => OrganizationMembershipResponse
}

interface SupabaseOrganizationContextClient {
  from: (table: 'organization_users') => {
    select: (query: string) => OrganizationMembershipQueryBuilder
  }
}

function mapMembershipRow(
  row: OrganizationMembershipRow | null | undefined,
): ResolvedOrganizationContext | null {
  if (!row?.organizations?.id || !row.organizations.name || !row.organizations.slug) {
    return null
  }

  return {
    organizationId: row.organizations.id,
    organizationName: row.organizations.name,
    organizationSlug: row.organizations.slug,
    userJobTitle: row.job_title || undefined,
  }
}

async function loadMembership(
  query: OrganizationMembershipResponse,
): Promise<ResolvedOrganizationContext | null> {
  const { data, error } = await query

  if (error) {
    return null
  }

  return mapMembershipRow(data)
}

export function createOrganizationContextRepository(
  supabase: SupabaseOrganizationContextClient,
): OrganizationContextRepository {
  return {
    async findMembershipByOrganizationId(userId, organizationId) {
      return loadMembership(
        supabase
          .from('organization_users')
          .select('job_title, organizations!inner(id, name, slug)')
          .eq('user_id', userId)
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle(),
      )
    },
    async findMembershipByOrganizationSlug(userId, organizationSlug) {
      return loadMembership(
        supabase
          .from('organization_users')
          .select('job_title, organizations!inner(id, name, slug)')
          .eq('user_id', userId)
          .eq('status', 'active')
          .eq('organizations.slug', organizationSlug)
          .limit(1)
          .maybeSingle(),
      )
    },
    async findLatestMembership(userId) {
      return loadMembership(
        supabase
          .from('organization_users')
          .select('job_title, organizations!inner(id, name, slug)')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('joined_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      )
    },
  }
}

export function extractOrganizationSlugFromPage(
  currentPage?: string,
): string | undefined {
  if (!currentPage) {
    return undefined
  }

  const match = currentPage.match(
    /^\/([^/?#]+)\/(business-panel|business-user)(?:\/|$)/,
  )

  return match?.[1]
}

export async function resolveActiveOrganizationContext(params: {
  userId?: string
  requestedOrganizationId?: string
  currentPage?: string
  repository?: OrganizationContextRepository
}): Promise<ResolvedOrganizationContext | null> {
  const {
    userId,
    requestedOrganizationId,
    currentPage,
    repository: repositoryOverride,
  } = params

  if (!userId) {
    return null
  }

  const repository =
    repositoryOverride ||
    createOrganizationContextRepository(
      await (await import('../../../../lib/supabase/server')).createClient(),
    )

  const organizationSlugFromPage = extractOrganizationSlugFromPage(currentPage)
  if (organizationSlugFromPage) {
    const membershipFromPage = await repository.findMembershipByOrganizationSlug(
      userId,
      organizationSlugFromPage,
    )

    if (membershipFromPage) {
      return membershipFromPage
    }
  }

  if (requestedOrganizationId) {
    const membershipFromOrganizationId =
      await repository.findMembershipByOrganizationId(
        userId,
        requestedOrganizationId,
      )

    if (membershipFromOrganizationId) {
      return membershipFromOrganizationId
    }
  }

  return repository.findLatestMembership(userId)
}
