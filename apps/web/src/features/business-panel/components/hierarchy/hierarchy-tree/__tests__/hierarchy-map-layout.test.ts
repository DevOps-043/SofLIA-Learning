import { describe, expect, it } from 'vitest';
import type { OrganizationNode } from '../../../../types/dynamicHierarchy.types';
import { calculateHierarchyMapLayout, getHierarchyMapBounds } from '../hierarchy-map-layout';

function node(
  id: string,
  parentId: string | null,
  position: number,
): OrganizationNode {
  return {
    id,
    structure_id: 'structure-1',
    organization_id: 'organization-1',
    parent_id: parentId,
    name: id,
    type: parentId ? 'region' : 'root',
    properties: {},
    path: id,
    depth: parentId ? 1 : 0,
    position,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  };
}

describe('calculateHierarchyMapLayout', () => {
  it('places children to the right and centers parents between them', () => {
    const positions = calculateHierarchyMapLayout([
      node('root', null, 0),
      node('mexico', 'root', 2),
      node('peru', 'root', 1),
      node('lima', 'peru', 0),
    ]);

    expect(positions.peru.x).toBeGreaterThan(positions.root.x);
    expect(positions.lima.x).toBeGreaterThan(positions.peru.x);
    expect(positions.peru.y).toBeLessThan(positions.mexico.y);
    expect(positions.root.y).toBe((positions.peru.y + positions.mexico.y) / 2);
  });

  it('keeps orphaned legacy nodes visible and returns usable bounds', () => {
    const positions = calculateHierarchyMapLayout([
      node('root', null, 0),
      node('orphan', 'missing-parent', 0),
    ]);
    const bounds = getHierarchyMapBounds(positions);

    expect(Object.keys(positions)).toEqual(expect.arrayContaining(['root', 'orphan']));
    expect(bounds.maxY).toBeGreaterThan(bounds.minY);
  });
});
