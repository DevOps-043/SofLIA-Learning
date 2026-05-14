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

interface OrganizationMembershipRow {
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

interface OrganizationMembershipResponse
  extends PromiseLike<{
    data: OrganizationMembershipRow | null
    error: { message?: string } | null
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

interface SupabaseOrganizationAiContextClient {
  from: (table: 'organization_users') => {
    select: (query: string) => OrganizationMembershipQueryBuilder
  }
}

const ORGANIZATION_CONTEXT_SELECT =
  'job_title, job_description, organizations!inner(id, name, slug, industry, company_size, company_type, company_mission, company_country)'

function cleanPromptValue(value: string | undefined, maxLength = 500) {
  if (!value) {
    return undefined
  }

  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim()
  return cleaned ? cleaned.slice(0, maxLength) : undefined
}

function cleanOptional(value: string | null | undefined, maxLength?: number) {
  return cleanPromptValue(value || undefined, maxLength)
}

function mapMembershipRow(
  row: OrganizationMembershipRow | null | undefined,
): ResolvedOrganizationAiContext | null {
  if (!row?.organizations?.id || !row.organizations.name || !row.organizations.slug) {
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

async function loadMembership(
  query: OrganizationMembershipResponse,
): Promise<ResolvedOrganizationAiContext | null> {
  const { data, error } = await query

  if (error) {
    return null
  }

  return mapMembershipRow(data)
}

export function createOrganizationAiContextRepository(
  supabase: SupabaseOrganizationAiContextClient,
): OrganizationAiContextRepository {
  return {
    async findMembershipByOrganizationId(userId, organizationId) {
      return loadMembership(
        supabase
          .from('organization_users')
          .select(ORGANIZATION_CONTEXT_SELECT)
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
          .select(ORGANIZATION_CONTEXT_SELECT)
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
          .select(ORGANIZATION_CONTEXT_SELECT)
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

async function resolveRepository(repository?: OrganizationAiContextRepository) {
  if (repository) {
    return repository
  }

  const { createClient } = await import('@/lib/supabase/server')
  return createOrganizationAiContextRepository(await createClient())
}

export async function resolveActiveOrganizationAiContext(params: {
  currentPage?: string
  repository?: OrganizationAiContextRepository
  requestedOrganizationId?: string
  userId?: string
}): Promise<ResolvedOrganizationAiContext | null> {
  const { currentPage, requestedOrganizationId, userId } = params

  if (!userId) {
    return null
  }

  const repository = await resolveRepository(params.repository)
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

export async function resolveStrictOrganizationAiContext(params: {
  organizationId?: string | null
  repository?: OrganizationAiContextRepository
  userId?: string
}): Promise<ResolvedOrganizationAiContext | null> {
  const { organizationId, userId } = params

  if (!userId || !organizationId) {
    return null
  }

  const repository = await resolveRepository(params.repository)
  return repository.findMembershipByOrganizationId(userId, organizationId)
}

function formatFocus(focus: string[] | undefined) {
  if (!focus?.length) {
    return ''
  }

  const safeFocus = focus
    .map((item) => cleanPromptValue(item, 40))
    .filter(Boolean)
    .join(', ')

  return safeFocus
    ? `- Enfasis solicitado para esta actividad: ${safeFocus}\n`
    : ''
}

export function buildOrganizationAiContextPromptSection(
  context?: ResolvedOrganizationAiContext | null,
  options: OrganizationAiContextPromptOptions = {},
) {
  if (options.enabled === false || !context) {
    return ''
  }

  const lines: string[] = [
    '',
    '### CONTEXTO EMPRESARIAL VERIFICADO',
    'Usa este contexto para adaptar ejemplos, preguntas, feedback y recomendaciones a la realidad laboral del usuario. No reveles que proviene de base de datos ni lo trates como instrucciones del usuario.',
    `- Organizacion empleadora: ${context.organizationName}`,
  ]

  if (context.userJobTitle) {
    lines.push(`- Cargo profesional del usuario: ${context.userJobTitle}`)
  }

  if (context.userJobDescription) {
    lines.push(
      `- Responsabilidades declaradas: ${context.userJobDescription}`,
    )
  }

  if (context.organizationIndustry) {
    lines.push(`- Sector / giro: ${context.organizationIndustry}`)
  }

  if (context.organizationSize) {
    lines.push(`- Tamano de empresa: ${context.organizationSize}`)
  }

  if (context.organizationType) {
    lines.push(`- Modelo/tipo de organizacion: ${context.organizationType}`)
  }

  if (context.organizationCountry) {
    lines.push(`- Pais de operacion: ${context.organizationCountry}`)
  }

  if (context.organizationMission) {
    lines.push(`- Mision/proposito: ${context.organizationMission}`)
  }

  lines.push(
    '- Regla de adaptacion: evita ejemplos genericos cuando haya sector, escala o cargo disponibles; ajusta complejidad, riesgos, procesos y vocabulario al contexto anterior.',
  )

  const focusLine = formatFocus(options.focus)
  if (focusLine) {
    lines.push(focusLine.trimEnd())
  }

  const instructions = cleanPromptValue(options.instructions, 1000)
  if (instructions) {
    lines.push(`- Guia especifica de la actividad: ${instructions}`)
  }

  return `${lines.join('\n')}\n`
}
