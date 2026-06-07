import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DynamicHierarchyService } from '../dynamicHierarchy.service'

describe('DynamicHierarchyService', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ success: true, nodes: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      ),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses org-scoped hierarchy endpoints with credentials', async () => {
    await DynamicHierarchyService.getTree('structure id', 'acme')

    expect(fetch).toHaveBeenCalledWith(
      '/api/acme/business/hierarchy/nodes?structureId=structure%20id',
      expect.objectContaining({
        credentials: 'include',
      }),
    )
  })

  it('keeps the legacy endpoint as a fallback when no org slug is available', async () => {
    await DynamicHierarchyService.getStructures()

    expect(fetch).toHaveBeenCalledWith(
      '/api/business/hierarchy/structures',
      expect.objectContaining({
        credentials: 'include',
      }),
    )
  })
})
