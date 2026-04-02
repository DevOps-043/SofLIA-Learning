import { describe, expect, it } from 'vitest'

import { calculateCompanyStats } from '../admin-companies/admin-companies-stats.service'
import type { AdminCompany } from '../../types/admin-companies.types'

function createCompany(overrides: Partial<AdminCompany>): AdminCompany {
  return {
    id: overrides.id || 'company',
    name: overrides.name || 'Empresa',
    slug: null,
    description: null,
    logo_url: null,
    brand_logo_url: null,
    brand_banner_url: null,
    brand_favicon_url: null,
    brand_color_primary: '#3b82f6',
    brand_color_secondary: '#10b981',
    brand_color_accent: '#8b5cf6',
    brand_font_family: 'Inter',
    contact_email: null,
    contact_phone: null,
    website_url: null,
    subscription_plan: null,
    subscription_status: null,
    subscription_start_date: null,
    subscription_end_date: null,
    is_active: true,
    max_users: 0,
    total_users: 0,
    active_users: 0,
    invited_users: 0,
    suspended_users: 0,
    google_login_enabled: false,
    microsoft_login_enabled: false,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    members: [],
    ...overrides,
  }
}

describe('admin-companies-stats.service', () => {
  it('calculates active, paused, pending and trial counts with seat utilization', () => {
    const stats = calculateCompanyStats([
      createCompany({
        id: 'active',
        is_active: true,
        subscription_status: 'active',
        max_users: 20,
        active_users: 12,
      }),
      createCompany({
        id: 'pending',
        is_active: false,
        subscription_status: 'pending',
        max_users: 10,
        active_users: 0,
      }),
      createCompany({
        id: 'trial',
        is_active: true,
        subscription_status: 'trial',
        subscription_plan: 'trial',
        max_users: 5,
        active_users: 3,
      }),
      createCompany({
        id: 'paused',
        is_active: false,
        subscription_status: 'expired',
        max_users: 15,
        active_users: 4,
      }),
    ])

    expect(stats).toEqual({
      totalCompanies: 4,
      activeCompanies: 2,
      trialCompanies: 1,
      pausedCompanies: 1,
      pendingCompanies: 1,
      totalSeats: 50,
      usedSeats: 19,
      averageUtilization: 38,
    })
  })
})
