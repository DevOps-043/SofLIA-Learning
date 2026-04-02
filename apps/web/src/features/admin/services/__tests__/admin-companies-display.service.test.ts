import { describe, expect, it } from 'vitest'

import {
  formatCompanyPlan,
  getAdminCompanyUserDisplayName,
  getCompanyStatusInfo,
  getCompanyUsagePercent,
} from '../admin-companies/admin-companies-display.service'
import type { AdminCompany } from '../../types/admin-companies.types'

const baseCompany: AdminCompany = {
  id: 'company-1',
  name: 'Empresa',
  slug: 'empresa',
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
  subscription_plan: 'business',
  subscription_status: 'active',
  subscription_start_date: null,
  subscription_end_date: null,
  is_active: true,
  max_users: 20,
  total_users: 0,
  active_users: 10,
  invited_users: 0,
  suspended_users: 0,
  google_login_enabled: false,
  microsoft_login_enabled: false,
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
  members: [],
}

describe('admin-companies-display.service', () => {
  it('formats known and unknown plans', () => {
    expect(formatCompanyPlan('business')).toEqual({ label: 'Business', color: '#00D4B3' })
    expect(formatCompanyPlan('custom')).toEqual({ label: 'custom', color: '#6C757D' })
  })

  it('resolves status badges and usage percent', () => {
    expect(getCompanyStatusInfo({ ...baseCompany, subscription_status: 'trial' }).label).toBe('Trial')
    expect(getCompanyStatusInfo({ ...baseCompany, is_active: false, subscription_status: 'pending' }).label).toBe('Pendiente')
    expect(getCompanyUsagePercent({ active_users: 25, max_users: 20 })).toBe(100)
  })

  it('builds readable user display names', () => {
    expect(
      getAdminCompanyUserDisplayName({
        id: 'user-1',
        email: 'ada@example.com',
        username: 'ada',
        first_name: 'Ada',
        last_name: 'Lovelace',
        display_name: null,
        profile_picture_url: null,
      })
    ).toBe('Ada Lovelace')

    expect(
      getAdminCompanyUserDisplayName({
        id: 'user-2',
        email: 'grace@example.com',
        username: 'grace',
        first_name: null,
        last_name: null,
        display_name: 'Grace Hopper',
        profile_picture_url: null,
      })
    ).toBe('Grace Hopper')

    expect(getAdminCompanyUserDisplayName(undefined)).toBe('Usuario')
  })
})
