import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock global fetch before importing
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { HierarchyService } from '../hierarchy.service'

// ─── helpers ─────────────────────────────────────────────────────────────────

function okResponse(data: unknown, extra = {}) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true, data, ...extra }),
  })
}

function errResponse(status = 500, message = 'Internal error') {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error: message }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── getConfig ────────────────────────────────────────────────────────────────

describe('HierarchyService.getConfig', () => {
  it('returns config when API succeeds', async () => {
    const mockConfig = { enabled: true, levels: ['region', 'zone', 'team'] }
    mockFetch.mockReturnValueOnce(okResponse({ config: mockConfig }))

    const result = await HierarchyService.getConfig('acme')
    expect(result).toEqual(mockConfig)
  })

  it('returns null when API fails', async () => {
    mockFetch.mockReturnValueOnce(errResponse())

    const result = await HierarchyService.getConfig('acme')
    expect(result).toBeNull()
  })

  it('returns null when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'))

    const result = await HierarchyService.getConfig('acme')
    expect(result).toBeNull()
  })

  it('uses correct URL without orgSlug', async () => {
    mockFetch.mockReturnValueOnce(okResponse({ config: {} }))

    await HierarchyService.getConfig()
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/business/hierarchy/config'),
      expect.any(Object)
    )
  })

  it('uses orgSlug in URL when provided', async () => {
    mockFetch.mockReturnValueOnce(okResponse({ config: {} }))

    await HierarchyService.getConfig('my-org')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/my-org/business/hierarchy/config'),
      expect.any(Object)
    )
  })
})

// ─── enableHierarchy / disableHierarchy ──────────────────────────────────────

describe('HierarchyService.enableHierarchy', () => {
  it('returns success response', async () => {
    mockFetch.mockReturnValueOnce(okResponse({ enabled: true }))

    const result = await HierarchyService.enableHierarchy('acme')
    expect(result.success).toBe(true)
  })
})

describe('HierarchyService.disableHierarchy', () => {
  it('returns error response when API fails', async () => {
    mockFetch.mockReturnValueOnce(errResponse(403, 'Forbidden'))

    const result = await HierarchyService.disableHierarchy('acme')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })
})

// ─── getStats ────────────────────────────────────────────────────────────────

describe('HierarchyService.getStats', () => {
  it('returns stats when API succeeds', async () => {
    const mockStats = { totalRegions: 3, totalZones: 9, totalTeams: 27, totalUsers: 100 }
    mockFetch.mockReturnValueOnce(okResponse({ stats: mockStats }))

    const result = await HierarchyService.getStats('acme')
    expect(result).toEqual(mockStats)
  })

  it('returns null when API fails', async () => {
    mockFetch.mockReturnValueOnce(errResponse())

    const result = await HierarchyService.getStats('acme')
    expect(result).toBeNull()
  })
})

// ─── getEntityCourses ────────────────────────────────────────────────────────

describe('HierarchyService.getEntityCourses', () => {
  it('returns courses array on success', async () => {
    const mockCourses = [{ id: 'c1', title: 'Course 1' }]
    mockFetch.mockReturnValueOnce(okResponse({ courses: mockCourses }))

    const result = await HierarchyService.getEntityCourses('region', 'r-1', 'acme')
    expect(result).toEqual(mockCourses)
  })

  it('returns empty array when API fails', async () => {
    mockFetch.mockReturnValueOnce(errResponse())

    const result = await HierarchyService.getEntityCourses('zone', 'z-1', 'acme')
    expect(result).toEqual([])
  })
})

// ─── getVisualAnalytics ──────────────────────────────────────────────────────

describe('HierarchyService.getVisualAnalytics', () => {
  it('returns analytics on success', async () => {
    const mockAnalytics = { completionRate: 80, activeUsers: 50 }
    mockFetch.mockReturnValueOnce(okResponse({ analytics: mockAnalytics }))

    const result = await HierarchyService.getVisualAnalytics('team', 't-1', 'acme')
    expect(result).toEqual(mockAnalytics)
  })

  it('returns null when API fails', async () => {
    mockFetch.mockReturnValueOnce(errResponse())

    const result = await HierarchyService.getVisualAnalytics('region', 'r-1')
    expect(result).toBeNull()
  })
})

// ─── getRegions / createRegion / deleteRegion ─────────────────────────────────

describe('HierarchyService.getRegions', () => {
  it('returns regions array on success', async () => {
    const mockRegions = [{ id: 'r-1', name: 'North', code: 'N' }]
    mockFetch.mockReturnValueOnce(okResponse(mockRegions))

    const result = await HierarchyService.getRegions(undefined, 'acme')
    expect(Array.isArray(result)).toBe(true)
  })

  it('returns empty array on failure', async () => {
    mockFetch.mockReturnValueOnce(errResponse())

    const result = await HierarchyService.getRegions()
    expect(result).toEqual([])
  })
})

describe('HierarchyService.createRegion', () => {
  it('returns success response with region data', async () => {
    const newRegion = { id: 'r-2', name: 'South', code: 'S' }
    mockFetch.mockReturnValueOnce(okResponse(newRegion))

    const result = await HierarchyService.createRegion({ name: 'South', code: 'S' }, 'acme')
    expect(result.success).toBe(true)
  })
})

describe('HierarchyService.deleteRegion', () => {
  it('returns success when deletion succeeds', async () => {
    mockFetch.mockReturnValueOnce(okResponse(null))

    const result = await HierarchyService.deleteRegion('r-1', 'acme')
    expect(result.success).toBe(true)
  })

  it('returns error when deletion fails', async () => {
    mockFetch.mockReturnValueOnce(errResponse(404, 'Region not found'))

    const result = await HierarchyService.deleteRegion('r-999', 'acme')
    expect(result.success).toBe(false)
  })
})
