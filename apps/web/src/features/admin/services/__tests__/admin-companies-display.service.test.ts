import { describe, expect, it } from 'vitest'

import {
  formatCompanyPlan,
  getAdminCompanyPlanColor,
  getAdminCompanyPlanKey,
  getAdminCompanyStatusDisplayConfig,
  getAdminCompanyStatusKey,
  getAdminCompanyUsageColor,
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
  brand_color_primary: 'var(--color-info)',
  brand_color_secondary: 'var(--color-success)',
  brand_color_accent: 'var(--color-secondary)',
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

const displayTheme = {
  primaryColor: 'var(--color-primary)',
  successColor: 'var(--color-success)',
  warningColor: 'var(--color-warning)',
  dangerColor: 'var(--color-error)',
  secondaryColor: 'var(--color-secondary)',
  mutedTextColor: 'var(--color-gray-500)',
}

describe('admin-companies-display.service', () => {
  it('formats known and unknown plans', () => {
    expect(formatCompanyPlan('business')).toEqual({ label: 'Business', color: 'var(--color-accent)' })
    expect(formatCompanyPlan('custom')).toEqual({ label: 'custom', color: 'var(--color-gray-500)' })
  })

  it('resolves status badges and usage percent', () => {
    expect(getCompanyStatusInfo({ ...baseCompany, subscription_status: 'trial' }).label).toBe('Trial')
    expect(getCompanyStatusInfo({ ...baseCompany, is_active: false, subscription_status: 'pending' }).label).toBe('Pendiente')
    expect(getCompanyUsagePercent({ active_users: 25, max_users: 20 })).toBe(100)
  })

  it('resolves token-based display config for migrated company UI', () => {
    expect(getAdminCompanyStatusKey({ ...baseCompany, is_active: false, subscription_status: 'pending' })).toBe('pending')
    expect(getAdminCompanyStatusDisplayConfig({ ...baseCompany, subscription_status: 'trial' }, displayTheme)).toMatchObject({
      key: 'trial',
      color: displayTheme.secondaryColor,
      bg: `color-mix(in srgb, ${displayTheme.secondaryColor} 7.8%, transparent)`,
      border: `color-mix(in srgb, ${displayTheme.secondaryColor} 14.9%, transparent)`,
    })
    expect(getAdminCompanyPlanKey('Enterprise')).toBe('enterprise')
    expect(getAdminCompanyPlanColor('business', displayTheme)).toBe(displayTheme.successColor)
    expect(getAdminCompanyUsageColor(95, displayTheme)).toBe(displayTheme.dangerColor)
    expect(getAdminCompanyUsageColor(75, displayTheme)).toBe(displayTheme.warningColor)
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
