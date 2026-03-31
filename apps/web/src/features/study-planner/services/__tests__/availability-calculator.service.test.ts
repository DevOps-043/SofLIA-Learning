import { describe, it, expect, vi } from 'vitest'

// Mock server-side modules pulled in transitively via user-context.service
vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('../user-identity.service', () => ({ UserIdentityService: {} }))
vi.mock('../user-organization.service', () => ({ UserOrganizationService: {} }))
vi.mock('../user-course-assignments.service', () => ({ UserCourseAssignmentsService: {} }))
vi.mock('../user-preferences.service', () => ({ UserPreferencesService: {} }))

import { AvailabilityCalculatorService, type AvailabilityEstimate } from '../availability-calculator.service'
import type { UserProfile } from '../user-context.service'

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-1',
    email: 'test@test.com',
    full_name: 'Test User',
    rol: null,
    nivel: null,
    cargo_titulo: null,
    area: null,
    tamano_empresa: null,
    ...overrides,
  } as UserProfile
}

describe('AvailabilityCalculatorService.formatDailyTime', () => {
  it('returns minutes when under 60', () => {
    expect(AvailabilityCalculatorService.formatDailyTime(30)).toBe('30 minutos')
    expect(AvailabilityCalculatorService.formatDailyTime(45)).toBe('45 minutos')
  })

  it('returns "1 hora" for exactly 60 minutes', () => {
    expect(AvailabilityCalculatorService.formatDailyTime(60)).toBe('1 hora')
  })

  it('returns plural "horas" for 2+ hours', () => {
    expect(AvailabilityCalculatorService.formatDailyTime(120)).toBe('2 horas')
  })

  it('returns mixed format for non-round hours', () => {
    expect(AvailabilityCalculatorService.formatDailyTime(90)).toBe('1h 30min')
    expect(AvailabilityCalculatorService.formatDailyTime(75)).toBe('1h 15min')
  })
})

describe('AvailabilityCalculatorService.getSessionTypeDescription', () => {
  it('returns description for short', () => {
    const result = AvailabilityCalculatorService.getSessionTypeDescription('short')
    expect(result.name).toBe('Sesión Corta')
    expect(result.range).toContain('20')
    expect(result.range).toContain('35')
  })

  it('returns description for medium', () => {
    const result = AvailabilityCalculatorService.getSessionTypeDescription('medium')
    expect(result.name).toBe('Sesión Media')
    expect(result.range).toContain('45')
    expect(result.range).toContain('60')
  })

  it('returns description for long', () => {
    const result = AvailabilityCalculatorService.getSessionTypeDescription('long')
    expect(result.name).toBe('Sesión Larga')
    expect(result.range).toContain('120')
  })
})

describe('AvailabilityCalculatorService.getSessionTimeRanges', () => {
  it('returns ranges for all three types', () => {
    const ranges = AvailabilityCalculatorService.getSessionTimeRanges()
    expect(ranges.short).toBeDefined()
    expect(ranges.medium).toBeDefined()
    expect(ranges.long).toBeDefined()
  })

  it('short range max is less than medium range min', () => {
    const ranges = AvailabilityCalculatorService.getSessionTimeRanges()
    expect(ranges.short.max).toBeLessThan(ranges.medium.min)
  })

  it('medium range max is less than long range min', () => {
    const ranges = AvailabilityCalculatorService.getSessionTimeRanges()
    expect(ranges.medium.max).toBeLessThan(ranges.long.min)
  })
})

describe('AvailabilityCalculatorService.calculateAvailability — role detection', () => {
  it('assigns c-level config for CEO role', () => {
    const result = AvailabilityCalculatorService.calculateAvailability(
      makeProfile({ rol: 'CEO' })
    )
    expect(result.dailyMinutesMax).toBeLessThanOrEqual(30)
    expect(result.recommendedSessionType).toBe('short')
  })

  it('assigns gerencia config for manager', () => {
    const result = AvailabilityCalculatorService.calculateAvailability(
      makeProfile({ rol: 'Gerente de Ventas' })
    )
    expect(result.weeklyHoursMax).toBeLessThanOrEqual(3)
  })

  it('assigns junior config for nivel "junior"', () => {
    const result = AvailabilityCalculatorService.calculateAvailability(
      makeProfile({ nivel: 'junior' })
    )
    // Junior has more daily time (60-90 min)
    expect(result.dailyMinutesMin).toBeGreaterThanOrEqual(50)
    expect(result.recommendedSessionType).toBe('long')
  })

  it('assigns senior config for cargo_titulo with "senior"', () => {
    const result = AvailabilityCalculatorService.calculateAvailability(
      makeProfile({ cargo_titulo: 'Senior Developer' })
    )
    expect(result.weeklyHoursMax).toBeLessThanOrEqual(5)
  })

  it('falls back to profesional for unknown role', () => {
    const result = AvailabilityCalculatorService.calculateAvailability(
      makeProfile({ rol: null, nivel: null, cargo_titulo: null })
    )
    expect(result.recommendedSessionType).toBe('medium')
  })
})

describe('AvailabilityCalculatorService.calculateAvailability — company size', () => {
  it('applies micro multiplier (1.2) for ≤10 employees', () => {
    const base = AvailabilityCalculatorService.calculateAvailability(makeProfile({ nivel: 'profesional' }))
    const micro = AvailabilityCalculatorService.calculateAvailability(
      makeProfile({ nivel: 'profesional', tamano_empresa: { max_empleados: 10, nombre: 'Micro' } as any })
    )
    expect(micro.dailyMinutesMax).toBeGreaterThan(base.dailyMinutesMax)
  })

  it('applies corporativa multiplier (0.7) for >1000 employees', () => {
    const base = AvailabilityCalculatorService.calculateAvailability(makeProfile({ nivel: 'profesional' }))
    const corp = AvailabilityCalculatorService.calculateAvailability(
      makeProfile({ nivel: 'profesional', tamano_empresa: { max_empleados: 5000, nombre: 'Corporativa' } as any })
    )
    expect(corp.dailyMinutesMax).toBeLessThan(base.dailyMinutesMax)
  })

  it('returns base multiplier (1.0) when tamano_empresa is null', () => {
    const result = AvailabilityCalculatorService.calculateAvailability(makeProfile({ tamano_empresa: null }))
    expect(result.adjustmentFactors.companySizeMultiplier).toBe(1.0)
  })
})

describe('AvailabilityCalculatorService.calculateAvailability — area multiplier', () => {
  it('applies technology multiplier (1.1) for tecnología area', () => {
    const base = AvailabilityCalculatorService.calculateAvailability(makeProfile({ area: null }))
    const tech = AvailabilityCalculatorService.calculateAvailability(makeProfile({ area: 'tecnología' }))
    expect(tech.adjustmentFactors.areaMultiplier).toBe(1.1)
    expect(tech.dailyMinutesMax).toBeGreaterThan(base.dailyMinutesMax)
  })

  it('applies sales multiplier (0.85) for ventas area', () => {
    const result = AvailabilityCalculatorService.calculateAvailability(makeProfile({ area: 'ventas' }))
    expect(result.adjustmentFactors.areaMultiplier).toBe(0.85)
  })

  it('applies default multiplier (1.0) for unknown area', () => {
    const result = AvailabilityCalculatorService.calculateAvailability(makeProfile({ area: 'diseño industrial' }))
    expect(result.adjustmentFactors.areaMultiplier).toBe(1.0)
  })
})

describe('AvailabilityCalculatorService.calculateAvailability — output structure', () => {
  it('returns all required fields', () => {
    const result = AvailabilityCalculatorService.calculateAvailability(makeProfile())
    expect(result.dailyMinutesMin).toBeGreaterThan(0)
    expect(result.dailyMinutesMax).toBeGreaterThan(0)
    expect(result.weeklyHoursMin).toBeGreaterThan(0)
    expect(result.weeklyHoursMax).toBeGreaterThan(0)
    expect(['short', 'medium', 'long']).toContain(result.recommendedSessionType)
    expect(result.explanation).toBeTruthy()
    expect(result.adjustmentFactors).toBeDefined()
    expect(result.adjustmentFactors.finalMultiplier).toBeGreaterThan(0)
  })

  it('dailyMinutesMin <= dailyMinutesMax', () => {
    const result = AvailabilityCalculatorService.calculateAvailability(makeProfile({ rol: 'CEO' }))
    expect(result.dailyMinutesMin).toBeLessThanOrEqual(result.dailyMinutesMax)
  })

  it('weeklyHoursMin <= weeklyHoursMax', () => {
    const result = AvailabilityCalculatorService.calculateAvailability(makeProfile())
    expect(result.weeklyHoursMin).toBeLessThanOrEqual(result.weeklyHoursMax)
  })

  it('finalMultiplier equals companySizeMultiplier × areaMultiplier', () => {
    const result = AvailabilityCalculatorService.calculateAvailability(
      makeProfile({ area: 'ventas', tamano_empresa: { max_empleados: 5, nombre: 'Micro' } as any })
    )
    const { companySizeMultiplier, areaMultiplier, finalMultiplier } = result.adjustmentFactors
    expect(finalMultiplier).toBeCloseTo(companySizeMultiplier * areaMultiplier, 5)
  })
})
