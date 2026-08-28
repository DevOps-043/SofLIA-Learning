import { describe, expect, it } from 'vitest'
import { getApiRouteAuthRequirement } from '../api-route-auth'

describe('getApiRouteAuthRequirement', () => {
  it('keeps documented public routes public', () => {
    expect(getApiRouteAuthRequirement('/api/health')).toMatchObject({
      kind: 'public',
    })
    expect(getApiRouteAuthRequirement('/api/landing/contact', 'POST')).toMatchObject({
      kind: 'public',
    })
    expect(getApiRouteAuthRequirement('/api/status')).toMatchObject({
      kind: 'public',
    })
    expect(getApiRouteAuthRequirement('/api/certificates/verify/hash')).toMatchObject({
      kind: 'public',
    })
    expect(getApiRouteAuthRequirement('/api/organizations/acme')).toMatchObject({
      kind: 'public',
    })
    expect(getApiRouteAuthRequirement('/api/organizations/acme/styles')).toMatchObject({
      kind: 'public',
    })
  })

  it('delegates internal job routes to their secret validator', () => {
    expect(getApiRouteAuthRequirement('/api/internal/jobs/users/bulk-import')).toMatchObject({
      kind: 'internal',
    })
    expect(getApiRouteAuthRequirement('/api/cron/process-inbox')).toMatchObject({
      kind: 'internal',
    })
  })

  it('requires admin role for platform admin APIs', () => {
    const requirement = getApiRouteAuthRequirement(
      '/api/admin/courses/course-id/modules/module-id/lessons/lesson-id',
      'DELETE',
    )

    expect(requirement).toMatchObject({
      kind: 'authenticated',
      roles: ['Administrador'],
    })
  })

  it('requires authenticated access for service-role upload API', () => {
    const requirement = getApiRouteAuthRequirement('/api/upload', 'POST')

    expect(requirement).toMatchObject({
      kind: 'authenticated',
      roles: expect.arrayContaining([
        'Usuario',
        'Instructor',
        'Administrador',
        'Business',
        'Business User',
      ]),
    })
  })

  it('requires business-admin access for org scoped business APIs', () => {
    const requirement = getApiRouteAuthRequirement(
      '/api/acme/business/hierarchy/nodes',
      'POST',
    )

    expect(requirement).toMatchObject({
      kind: 'authenticated',
      organizationMode: 'business-admin',
      organizationSlug: 'acme',
      roles: ['Business', 'Administrador'],
    })
  })

  it('requires business-user access for org scoped employee APIs', () => {
    const requirement = getApiRouteAuthRequirement(
      '/api/acme/business-user/dashboard',
      'GET',
    )

    expect(requirement).toMatchObject({
      kind: 'authenticated',
      organizationMode: 'business-user',
      organizationSlug: 'acme',
      roles: ['Business User', 'Business', 'Administrador'],
    })
  })

  it('keeps public reads open but protects mutations on content APIs', () => {
    expect(getApiRouteAuthRequirement('/api/courses', 'GET')).toMatchObject({
      kind: 'public',
    })
    expect(getApiRouteAuthRequirement('/api/courses/some-course/enroll', 'POST')).toMatchObject({
      kind: 'authenticated',
    })
    expect(getApiRouteAuthRequirement('/api/profile', 'POST')).toMatchObject({
      kind: 'authenticated',
    })
  })

  it('protects org self-service APIs', () => {
    expect(getApiRouteAuthRequirement('/api/organizations/create', 'POST')).toMatchObject({
      kind: 'authenticated',
    })
  })

  it('fails closed for unknown APIs', () => {
    expect(getApiRouteAuthRequirement('/api/future-unclassified-route')).toMatchObject({
      kind: 'authenticated',
    })
  })

  it('does not expose diagnostic translation routes', () => {
    expect(getApiRouteAuthRequirement('/api/test-translation/lesson-es')).toMatchObject({
      kind: 'authenticated',
    })
  })

  it('only exposes explicitly enumerated auth endpoints', () => {
    expect(getApiRouteAuthRequirement('/api/auth/callback/google')).toMatchObject({
      kind: 'public',
    })
    expect(getApiRouteAuthRequirement('/api/auth/mfa/verify', 'POST')).toMatchObject({
      kind: 'public',
    })
    expect(getApiRouteAuthRequirement('/api/auth/me')).toMatchObject({
      kind: 'authenticated',
    })
    expect(getApiRouteAuthRequirement('/api/auth/sessions')).toMatchObject({
      kind: 'authenticated',
    })
  })
})
