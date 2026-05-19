import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AdminWorkshop } from '../../../services/adminWorkshops.service'
import {
  deleteAdminWorkshop,
  filterAdminWorkshops,
  formatWorkshopDuration,
  getAdminWorkshopCategoryConfig,
  getAdminWorkshopLevelConfig,
  getAdminWorkshopLevelKey,
  getAdminWorkshopStatusConfig,
  getWorkshopInstructorInitials,
} from '../admin-workshops-display.service'

function createWorkshop(overrides: Partial<AdminWorkshop>): AdminWorkshop {
  return {
    id: 'workshop-1',
    title: 'Taller de IA',
    description: 'Automatizacion aplicada',
    category: 'ia',
    level: 'beginner',
    duration_total_minutes: 90,
    instructor_id: 'instructor-1',
    instructor_name: 'Ada Lovelace',
    is_active: true,
    slug: 'taller-ia',
    student_count: 10,
    review_count: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

const displayTheme = {
  primaryColor: 'primary-token',
  successColor: 'success-token',
  warningColor: 'warning-token',
  dangerColor: 'danger-token',
  secondaryColor: 'secondary-token',
  mutedTextColor: 'muted-token',
  textColor: 'text-token',
  inputBg: 'input-token',
  borderColor: 'border-token',
}

describe('admin-workshops-display.service', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('filters by approval status, search, category and status', () => {
    const workshops = [
      createWorkshop({ id: '1', title: 'IA Generativa', category: 'ia' }),
      createWorkshop({
        id: '2',
        title: 'Backend Node',
        category: 'tecnologia',
        is_active: false,
      }),
      createWorkshop({
        id: '3',
        title: 'Pendiente',
        approval_status: 'pending',
      }),
    ]

    const result = filterAdminWorkshops(workshops, {
      searchTerm: 'node',
      category: 'tecnologia',
      status: 'inactive',
    })

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('2')
  })

  it('formats durations in a readable way', () => {
    expect(formatWorkshopDuration(0)).toBe('0 min')
    expect(formatWorkshopDuration(45)).toBe('45 min')
    expect(formatWorkshopDuration(60)).toBe('1h')
    expect(formatWorkshopDuration(135)).toBe('2h 15min')
  })

  it('builds instructor initials with fallbacks', () => {
    expect(getWorkshopInstructorInitials('Ada Lovelace')).toBe('AL')
    expect(getWorkshopInstructorInitials('Ada')).toBe('AD')
    expect(getWorkshopInstructorInitials('Sin instructor')).toBe('SI')
    expect(getWorkshopInstructorInitials()).toBe('SI')
  })

  it('resolves token-based badge configs for the migrated workshop UI', () => {
    expect(getAdminWorkshopLevelKey('Principiante')).toBe('beginner')
    expect(getAdminWorkshopLevelConfig('advanced', displayTheme)).toMatchObject({
      labelKey: 'workshops.card.level.advanced',
      color: displayTheme.dangerColor,
      bg: `color-mix(in srgb, ${displayTheme.dangerColor} 7.8%, transparent)`,
    })
    expect(getAdminWorkshopCategoryConfig('tecnologia', displayTheme)).toMatchObject({
      color: displayTheme.secondaryColor,
      border: `color-mix(in srgb, ${displayTheme.secondaryColor} 14.9%, transparent)`,
    })
    expect(getAdminWorkshopStatusConfig(true, displayTheme)).toMatchObject({
      labelKey: 'workshops.card.statusActive',
      color: displayTheme.successColor,
    })
  })

  it('propagates backend delete errors with the api message', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({
        error: 'No se pudieron eliminar los materiales de las lecciones del taller.',
      }),
    })

    vi.stubGlobal('fetch', fetchMock)

    await expect(deleteAdminWorkshop('workshop-1')).rejects.toThrow(
      'No se pudieron eliminar los materiales de las lecciones del taller.',
    )
  })
})
