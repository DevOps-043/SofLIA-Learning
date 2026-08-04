import { beforeEach, describe, expect, it, vi } from 'vitest'

const platformOrganization = vi.hoisted(() => ({
  data: {
    id: 'acme-id',
    name: 'Acme',
    slug: 'acme',
    industry: 'Tecnología',
    company_size: '100',
    company_type: 'B2B',
    company_mission: 'Aprender',
    company_country: 'México',
  } as Record<string, string> | null,
  error: null as { message: string } | null,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        maybeSingle: async () => platformOrganization,
      }
      return builder
    },
  }),
}))
import {
  extractOrganizationSlugFromPage,
  resolveActiveOrganizationContext,
  resolveChatOrganizationContext,
  resolvePlatformAdminOrganizationContext,
  type OrganizationContextRepository,
  type ResolvedOrganizationContext,
} from '../organization-context.service'

beforeEach(() => {
  platformOrganization.data = {
    id: 'acme-id',
    name: 'Acme',
    slug: 'acme',
    industry: 'Tecnología',
    company_size: '100',
    company_type: 'B2B',
    company_mission: 'Aprender',
    company_country: 'México',
  }
  platformOrganization.error = null
})

function createRepositoryStub(overrides?: {
  byId?: ResolvedOrganizationContext | null
  bySlug?: ResolvedOrganizationContext | null
  latest?: ResolvedOrganizationContext | null
}): OrganizationContextRepository {
  return {
    findMembershipByOrganizationId: vi
      .fn()
      .mockResolvedValue(overrides?.byId ?? null),
    findMembershipByOrganizationSlug: vi
      .fn()
      .mockResolvedValue(overrides?.bySlug ?? null),
    findLatestMembership: vi.fn().mockResolvedValue(overrides?.latest ?? null),
  }
}

describe('organization-context.service', () => {
  it('prefers the organization slug from the active business route', async () => {
    const repository = createRepositoryStub({
      bySlug: {
        organizationId: 'board-ready-id',
        organizationName: 'Board Ready',
        organizationSlug: 'board-ready',
        userJobTitle: 'Director comercial',
      },
      byId: {
        organizationId: 'pulsehub-id',
        organizationName: 'Pulse Hub',
        organizationSlug: 'pulse-hub',
        userJobTitle: 'Director comercial',
      },
    })

    const organizationContext = await resolveActiveOrganizationContext({
      userId: 'user-1',
      requestedOrganizationId: 'pulsehub-id',
      currentPage: '/board-ready/business-user/dashboard',
      repository,
    })

    expect(organizationContext?.organizationSlug).toBe('board-ready')
    expect(repository.findMembershipByOrganizationSlug).toHaveBeenCalledWith(
      'user-1',
      'board-ready',
    )
    expect(repository.findMembershipByOrganizationId).not.toHaveBeenCalled()
  })

  it('no degrada a otra organización cuando la ruta fija un tenant sin membresía', async () => {
    // Regresión: con este respaldo SofLIA afirmaba que el usuario pertenecía a
    // otra de sus empresas mientras navegaba el panel de una distinta.
    const repository = createRepositoryStub({
      latest: {
        organizationId: 'talen4all-id',
        organizationName: 'Talen4All',
        organizationSlug: 'talen4all',
      },
    })

    const organizationContext = await resolveActiveOrganizationContext({
      userId: 'user-1',
      currentPage: '/board-ready/business-user/dashboard',
      repository,
    })

    expect(organizationContext).toBeNull()
    expect(repository.findLatestMembership).not.toHaveBeenCalled()
  })

  it('falls back to the explicitly requested organization id on non-org routes', async () => {
    const repository = createRepositoryStub({
      byId: {
        organizationId: 'board-ready-id',
        organizationName: 'Board Ready',
        organizationSlug: 'board-ready',
        userJobTitle: 'Director comercial',
      },
    })

    const organizationContext = await resolveActiveOrganizationContext({
      userId: 'user-1',
      requestedOrganizationId: 'board-ready-id',
      currentPage: '/courses/ia-para-lideres/learn',
      repository,
    })

    expect(organizationContext?.organizationId).toBe('board-ready-id')
    expect(repository.findMembershipByOrganizationId).toHaveBeenCalledWith(
      'user-1',
      'board-ready-id',
    )
  })

  it('falls back to the latest active membership when no session org is available', async () => {
    const repository = createRepositoryStub({
      latest: {
        organizationId: 'board-ready-id',
        organizationName: 'Board Ready',
        organizationSlug: 'board-ready',
        userJobTitle: 'Director comercial',
      },
    })

    const organizationContext = await resolveActiveOrganizationContext({
      userId: 'user-1',
      repository,
    })

    expect(organizationContext?.organizationName).toBe('Board Ready')
    expect(repository.findLatestMembership).toHaveBeenCalledWith('user-1')
  })

  it('extracts organization slugs only from business routes', () => {
    expect(
      extractOrganizationSlugFromPage('/board-ready/business-user/dashboard'),
    ).toBe('board-ready')
    expect(
      extractOrganizationSlugFromPage('/board-ready/business-panel/settings'),
    ).toBe('board-ready')
    expect(extractOrganizationSlugFromPage('/courses/ia-para-lideres/learn')).toBe(
      undefined,
    )
  })

  it('resuelve para superadmin la organización visible aunque no tenga membresía', async () => {
    const context = await resolvePlatformAdminOrganizationContext(
      '/acme/business-panel/hierarchy',
    )

    expect(context).toMatchObject({
      organizationId: 'acme-id',
      organizationSlug: 'acme',
      organizationName: 'Acme',
    })
  })

  it('no resuelve organización privilegiada desde business-user', async () => {
    expect(await resolvePlatformAdminOrganizationContext(
      '/acme/business-user/dashboard',
    )).toBeNull()
  })

  it('no concede contexto privilegiado si la organización ya no está activa', async () => {
    platformOrganization.data = null

    expect(await resolvePlatformAdminOrganizationContext(
      '/acme/business-panel/hierarchy',
    )).toBeNull()
  })
})

describe('resolveChatOrganizationContext', () => {
  const sofliaMembership: ResolvedOrganizationContext = {
    organizationId: 'soflia-id',
    organizationName: 'SofLIA',
    organizationSlug: 'soflia',
    userJobTitle: 'Marketing',
  }

  it('conserva la membresía del superadmin fuera del business-panel', async () => {
    // Regresión del fallo reportado: la lectura privilegiada solo cubre
    // `/[slug]/business-panel`, y su null borraba la membresía correcta. El
    // contexto caía entonces en otra empresa del propio superadmin.
    const repository = createRepositoryStub({
      bySlug: sofliaMembership,
      latest: {
        organizationId: 'talen4all-id',
        organizationName: 'Talen4All',
        organizationSlug: 'talen4all',
      },
    })

    const organizationContext = await resolveChatOrganizationContext({
      userId: 'user-1',
      currentPage: '/soflia/business-user/dashboard',
      platformRole: 'Administrador',
      repository,
    })

    expect(organizationContext).toMatchObject({
      organizationId: 'soflia-id',
      organizationName: 'SofLIA',
    })
  })

  it('usa la lectura privilegiada en el business-panel de una organización ajena', async () => {
    const repository = createRepositoryStub()

    const organizationContext = await resolveChatOrganizationContext({
      userId: 'user-1',
      currentPage: '/acme/business-panel/users',
      platformRole: 'Administrador',
      repository,
    })

    expect(organizationContext).toMatchObject({
      organizationId: 'acme-id',
      organizationSlug: 'acme',
    })
  })

  it('no concede la lectura privilegiada a quien no es superadmin', async () => {
    const repository = createRepositoryStub({
      latest: {
        organizationId: 'talen4all-id',
        organizationName: 'Talen4All',
        organizationSlug: 'talen4all',
      },
    })

    const organizationContext = await resolveChatOrganizationContext({
      userId: 'user-1',
      currentPage: '/acme/business-panel/users',
      platformRole: 'Usuario',
      repository,
    })

    expect(organizationContext).toBeNull()
    expect(repository.findLatestMembership).not.toHaveBeenCalled()
  })
})
