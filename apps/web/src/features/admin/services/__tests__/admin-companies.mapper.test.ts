import { describe, expect, it } from 'vitest'

import { mapOrganizationRow, type OrganizationRow } from '../admin-companies/admin-companies.mapper'
import { DEFAULT_BRAND_PRIMARY } from '../admin-companies/admin-company-brand-colors'

describe('admin-companies.mapper', () => {
  it('maps organization rows with defaults, pending invitations and resolved users', () => {
    const organization: OrganizationRow = {
      id: 'org-1',
      name: 'Empresa Demo',
      slug: 'empresa-demo',
      description: 'Descripcion',
      logo_url: null,
      brand_logo_url: null,
      brand_banner_url: null,
      brand_favicon_url: null,
      brand_color_primary: null,
      brand_color_secondary: null,
      brand_color_accent: null,
      brand_font_family: null,
      contact_email: 'admin@empresa.com',
      contact_phone: null,
      website_url: null,
      subscription_plan: 'business',
      subscription_status: 'active',
      subscription_start_date: null,
      subscription_end_date: null,
      is_active: true,
      max_users: 50,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-02T00:00:00.000Z',
      google_login_enabled: null,
      microsoft_login_enabled: true,
      organization_users: [
        {
          id: 'membership-1',
          user_id: 'user-1',
          role: 'owner',
          status: 'active',
          joined_at: '2025-01-03T00:00:00.000Z',
        },
        {
          id: 'membership-2',
          user_id: 'user-2',
          role: 'member',
          status: 'invited',
          joined_at: null,
        },
      ],
    }

    const company = mapOrganizationRow(organization, {
      pendingInvitationCount: 2,
      usersMap: new Map([
        [
          'user-1',
          {
            id: 'user-1',
            email: 'owner@empresa.com',
            username: 'owner',
            first_name: 'Ada',
            last_name: 'Lovelace',
            display_name: null,
            profile_picture_url: null,
          },
        ],
      ]),
    })

    expect(company.brand_color_primary).toBe(DEFAULT_BRAND_PRIMARY)
    expect(company.brand_font_family).toBe('Inter Tight')
    expect(company.active_users).toBe(1)
    expect(company.invited_users).toBe(3)
    expect(company.total_users).toBe(2)
    expect(company.google_login_enabled).toBe(false)
    expect(company.members[0].user?.email).toBe('owner@empresa.com')
    expect(company.members[1].user).toBeUndefined()
  })
})
