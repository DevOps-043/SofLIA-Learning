import { createDefaultOrganizationAiContextRepository } from './organization-ai-context.repository'
import type {
  OrganizationAiContextRepository,
  ResolvedOrganizationAiContext,
} from './organization-ai-context.types'

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
  return repository ?? createDefaultOrganizationAiContextRepository()
}

export async function resolveActiveOrganizationAiContext(params: {
  currentPage?: string
  repository?: OrganizationAiContextRepository
  requestedOrganizationId?: string
  userId?: string
}): Promise<ResolvedOrganizationAiContext | null> {
  const { currentPage, requestedOrganizationId, userId } = params
  if (!userId) return null

  const repository = await resolveRepository(params.repository)
  const organizationSlug = extractOrganizationSlugFromPage(currentPage)

  if (organizationSlug) {
    // La URL fija el tenant: la respuesta debe hablar de ESA organización o de
    // ninguna. Degradar aquí a otra membresía hacía que SofLIA afirmara un
    // empleador falso e inyectara cargo, sector y misión de otra empresa en el
    // prompt, así que la ausencia de membresía se propaga tal cual.
    return repository.findMembershipByOrganizationSlug(userId, organizationSlug)
  }

  if (requestedOrganizationId) {
    const context = await repository.findMembershipByOrganizationId(
      userId,
      requestedOrganizationId,
    )

    if (context) return context
  }

  return repository.findLatestMembership(userId)
}

export async function resolveStrictOrganizationAiContext(params: {
  organizationId?: string | null
  repository?: OrganizationAiContextRepository
  userId?: string
}): Promise<ResolvedOrganizationAiContext | null> {
  const { organizationId, userId } = params
  if (!userId || !organizationId) return null

  const repository = await resolveRepository(params.repository)
  return repository.findMembershipByOrganizationId(userId, organizationId)
}

/**
 * Contexto empresarial para las actividades del curso.
 *
 * Se prefiere la organización de la inscripción, pero si esa inscripción es
 * antigua y no tiene organización (o la membresía no coincide) se recurre a la
 * membresía activa del usuario. Sin ese respaldo SofLIA perdía por completo el
 * cargo y la empresa, y respondía con ejemplos genéricos.
 *
 * Este contexto SOLO alimenta el prompt: no concede acceso a nada, así que
 * degradar a la membresía activa no abre ninguna vía de escalación.
 */
export async function resolveCourseOrganizationAiContext(params: {
  organizationId?: string | null
  repository?: OrganizationAiContextRepository
  userId?: string
}): Promise<ResolvedOrganizationAiContext | null> {
  const { organizationId, userId } = params
  if (!userId) return null

  const repository = await resolveRepository(params.repository)

  if (organizationId) {
    const scopedContext = await repository.findMembershipByOrganizationId(
      userId,
      organizationId,
    )

    if (scopedContext) return scopedContext
  }

  return repository.findLatestMembership(userId)
}
