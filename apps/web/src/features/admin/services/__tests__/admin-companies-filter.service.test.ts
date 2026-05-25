import { describe, expect, it } from 'vitest'

import { filterAdminCompanies } from '../admin-companies/admin-companies-filter.service'
import type { AdminCompany } from '../../types/admin-companies.types'

const companies: AdminCompany[] = [
  {
    id: '1',
    name: 'Alpha Corp',
    slug: 'alpha',
    description: null,
    logo_url: null,
    brand_logo_url: null,
    brand_banner_url: null,
    brand_favicon_url: null,
    brand_color_primary: 'var(--color-info)',
    brand_color_secondary: 'var(--color-success)',
    brand_color_accent: 'var(--color-secondary)',
    brand_font_family: 'Inter',
    contact_email: 'alpha@example.com',
    contact_phone: null,
    website_url: null,
    subscription_plan: 'team',
    subscription_status: 'active',
    subscription_start_date: null,
    subscription_end_date: null,
    is_active: true,
    max_users: 10,
    total_users: 10,
    active_users: 8,
    invited_users: 1,
    suspended_users: 1,
    google_login_enabled: false,
    microsoft_login_enabled: false,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    members: [],
  },
  {
    id: '2',
    name: 'Beta Labs',
    slug: 'beta',
    description: null,
    logo_url: null,
    brand_logo_url: null,
    brand_banner_url: null,
    brand_favicon_url: null,
    brand_color_primary: 'var(--color-info)',
    brand_color_secondary: 'var(--color-success)',
    brand_color_accent: 'var(--color-secondary)',
    brand_font_family: 'Inter',
    contact_email: 'beta@example.com',
    contact_phone: null,
    website_url: null,
    subscription_plan: 'business',
    subscription_status: 'trial',
    subscription_start_date: null,
    subscription_end_date: null,
    is_active: true,
    max_users: 50,
    total_users: 20,
    active_users: 12,
    invited_users: 4,
    suspended_users: 4,
    google_login_enabled: false,
    microsoft_login_enabled: false,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    members: [],
  },
]

describe('admin-companies-filter.service', () => {
  it('filters by search, plan and status', () => {
    expect(
      filterAdminCompanies(companies, {
        searchTerm: 'beta',
        planFilter: 'business',
        statusFilter: 'trial',
      }).map((company) => company.id)
    ).toEqual(['2'])
  })

  it('keeps active companies out of trial filter and trial out of active filter', () => {
    expect(
      filterAdminCompanies(companies, {
        searchTerm: '',
        planFilter: 'all',
        statusFilter: 'active',
      }).map((company) => company.id)
    ).toEqual(['1'])
  })
})
