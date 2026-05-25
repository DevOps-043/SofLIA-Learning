import { expect, test } from '@playwright/test'

const deniedOrigin = 'https://not-allowed.soflia.invalid'

const tenantConfig = {
  adminCookie: process.env.TENANT_E2E_ADMIN_COOKIE_HEADER,
  orgACookie: process.env.TENANT_E2E_ORG_A_COOKIE_HEADER,
  orgBSlug: process.env.TENANT_E2E_ORG_B_SLUG,
}

test.describe.configure({ mode: 'serial' })

test('does not grant CORS headers to a disallowed origin', async ({ request }) => {
  const response = await request.get('/api/auth/me', {
    headers: { Origin: deniedOrigin },
  })

  expect([401, 403]).toContain(response.status())
  expect(response.headers()['content-type']).toContain('application/json')
  expect(response.headers()['access-control-allow-origin']).toBeUndefined()
})

test.describe('tenant isolation API checks', () => {
  test.skip(
    !tenantConfig.orgACookie || !tenantConfig.orgBSlug,
    'Set TENANT_E2E_ORG_A_COOKIE_HEADER and TENANT_E2E_ORG_B_SLUG to run cross-tenant checks.',
  )

  const crossTenantCases = [
    {
      method: 'GET',
      path: () => `/api/${tenantConfig.orgBSlug}/business/courses`,
    },
    {
      method: 'PUT',
      path: () => `/api/${tenantConfig.orgBSlug}/business/settings/organization`,
      body: { name: 'Cross tenant blocked' },
    },
    {
      method: 'GET',
      path: () => `/api/${tenantConfig.orgBSlug}/business/users`,
    },
    {
      method: 'POST',
      path: () => `/api/${tenantConfig.orgBSlug}/business/invite-links`,
      body: {
        maxUses: 1,
        role: 'member',
      },
    },
  ] as const

  for (const scenario of crossTenantCases) {
    test(`${scenario.method} ${scenario.path()} returns 403 for another org`, async ({ request }) => {
      const response = await request.fetch(scenario.path(), {
        data: 'body' in scenario ? scenario.body : undefined,
        headers: {
          Cookie: tenantConfig.orgACookie as string,
          'Content-Type': 'application/json',
        },
        method: scenario.method,
      })

      expect(response.status()).toBe(403)
    })
  }

  test('denied cross-tenant access is visible in the security audit log', async ({ request }) => {
    test.skip(
      !tenantConfig.adminCookie,
      'Set TENANT_E2E_ADMIN_COOKIE_HEADER to verify security_audit_log evidence.',
    )

    const response = await request.get('/api/admin/security/audit-log?limit=50', {
      headers: {
        Cookie: tenantConfig.adminCookie as string,
      },
    })

    expect(response.ok()).toBeTruthy()
    const payload = await response.json() as {
      events?: Array<{ action?: string; result?: string }>
    }

    expect(
      payload.events?.some((event) =>
        event.result === 'denied' &&
        (event.action === 'access-denied' || event.action === 'mfa-verification-failed'),
      ),
    ).toBeTruthy()
  })
})
