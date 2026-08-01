import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DynamicHierarchyService } from '../../../../services/dynamicHierarchy.service'
import type { OrganizationNode } from '../../../../types/dynamicHierarchy.types'
import { saveHierarchyNode } from '../hierarchy-node-actions'

vi.mock('../../../../services/dynamicHierarchy.service', () => ({
  DynamicHierarchyService: {
    createNode: vi.fn(),
    updateNode: vi.fn(),
  },
}))

const node = {
  id: '00000000-0000-4000-8000-000000000001',
} as OrganizationNode

describe('saveHierarchyNode', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends null when clearing a manager', async () => {
    vi.mocked(DynamicHierarchyService.updateNode).mockResolvedValue({ success: true })

    await saveHierarchyNode({
      managerId: null,
      mode: 'edit',
      name: 'General',
      orgSlug: 'acme',
      selectedStructureId: '00000000-0000-4000-8000-000000000002',
      targetNode: node,
      type: 'root',
    })

    expect(DynamicHierarchyService.updateNode).toHaveBeenCalledWith(
      node.id,
      expect.objectContaining({ manager_id: null }),
      'acme',
    )
  })

  it('surfaces API failures instead of closing the form silently', async () => {
    vi.mocked(DynamicHierarchyService.updateNode).mockResolvedValue({
      success: false,
      error: 'Update failed',
    })

    await expect(saveHierarchyNode({
      mode: 'edit',
      name: 'General',
      orgSlug: 'acme',
      selectedStructureId: '00000000-0000-4000-8000-000000000002',
      targetNode: node,
      type: 'root',
    })).rejects.toThrow('Update failed')
  })
})
