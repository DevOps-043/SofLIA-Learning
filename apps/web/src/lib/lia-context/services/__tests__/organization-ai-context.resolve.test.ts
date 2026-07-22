import { describe, expect, it, vi } from 'vitest'

import { buildOrganizationAiContextPromptSection } from '../organization-ai-context.prompt'
import {
  resolveCourseOrganizationAiContext,
  resolveStrictOrganizationAiContext,
} from '../organization-ai-context.resolve'
import type {
  OrganizationAiContextRepository,
  ResolvedOrganizationAiContext,
} from '../organization-ai-context.types'

function makeContext(
  overrides: Partial<ResolvedOrganizationAiContext> = {},
): ResolvedOrganizationAiContext {
  return {
    organizationId: 'org-1',
    organizationName: 'Acme Retail',
    organizationSlug: 'acme-retail',
    userJobTitle: 'Marketing Manager',
    organizationIndustry: 'Retail',
    ...overrides,
  }
}

function makeRepository(
  byId: ResolvedOrganizationAiContext | null,
): OrganizationAiContextRepository {
  return {
    findMembershipByOrganizationId: vi.fn().mockResolvedValue(byId),
    findMembershipByOrganizationSlug: vi.fn().mockResolvedValue(null),
    findLatestMembership: vi
      .fn()
      .mockResolvedValue(makeContext({ organizationId: 'latest' })),
  }
}

describe('resolveCourseOrganizationAiContext', () => {
  it('usa la organización de la inscripción cuando existe', async () => {
    const repository = makeRepository(makeContext())

    const context = await resolveCourseOrganizationAiContext({
      organizationId: 'org-1',
      repository,
      userId: 'user-1',
    })

    expect(context?.organizationId).toBe('org-1')
    expect(repository.findMembershipByOrganizationId).toHaveBeenCalledWith(
      'user-1',
      'org-1',
    )
    expect(repository.findLatestMembership).not.toHaveBeenCalled()
  })

  it('recurre a la membresía activa cuando la inscripción no tiene organización', async () => {
    const repository = makeRepository(null)

    const context = await resolveCourseOrganizationAiContext({
      organizationId: null,
      repository,
      userId: 'user-1',
    })

    // Sin este respaldo SofLIA perdía el cargo y la empresa del estudiante y
    // volvía a los ejemplos genéricos.
    expect(context?.organizationId).toBe('latest')
    expect(repository.findMembershipByOrganizationId).not.toHaveBeenCalled()
    expect(repository.findLatestMembership).toHaveBeenCalledWith('user-1')
  })

  it('recurre a la membresía activa cuando la organización no coincide', async () => {
    const repository = makeRepository(null)

    await expect(
      resolveCourseOrganizationAiContext({
        organizationId: 'org-desconocida',
        repository,
        userId: 'user-1',
      }),
    ).resolves.toMatchObject({ organizationId: 'latest' })
  })

  it('no resuelve contexto sin usuario', async () => {
    const repository = makeRepository(makeContext())

    await expect(
      resolveCourseOrganizationAiContext({ organizationId: 'org-1', repository }),
    ).resolves.toBeNull()
    expect(repository.findLatestMembership).not.toHaveBeenCalled()
  })

  it('el resolutor estricto sigue sin respaldo (semántica original)', async () => {
    const repository = makeRepository(null)

    await expect(
      resolveStrictOrganizationAiContext({
        organizationId: 'org-desconocida',
        repository,
        userId: 'user-1',
      }),
    ).resolves.toBeNull()
    expect(repository.findLatestMembership).not.toHaveBeenCalled()
  })
})

describe('buildOrganizationAiContextPromptSection: reglas de adaptación', () => {
  it('calibra los ejemplos al cargo cuando hay job_title', () => {
    const section = buildOrganizationAiContextPromptSection(
      makeContext({ userJobTitle: 'COO' }),
    )

    expect(section).toContain('Cargo profesional del usuario: COO')
    expect(section).toContain('alcance de decision real de un COO')
    expect(section).toContain('No nombres el cargo ni la empresa en cada mensaje')
  })

  it('omite las reglas de rol cuando la membresía no declara cargo', () => {
    const section = buildOrganizationAiContextPromptSection(
      makeContext({ userJobTitle: undefined }),
    )

    expect(section).toContain('CONTEXTO EMPRESARIAL VERIFICADO')
    expect(section).not.toContain('Regla de rol')
  })

  it('prohíbe inventar datos de empresa ausentes', () => {
    // Caso real de producción: la organización aún no llenó "Contexto para
    // SofLIA", así que solo hay nombre y cargo.
    const section = buildOrganizationAiContextPromptSection({
      organizationId: 'org-2',
      organizationName: 'Pulse Hub',
      organizationSlug: 'pulse-hub',
      userJobTitle: 'Soporte Tecnico',
    })

    expect(section).toContain('Regla de veracidad')
    expect(section).toContain('no inventes datos de la empresa')
    expect(section).not.toContain('Sector / giro')
    expect(section).not.toContain('undefined')
  })
})
