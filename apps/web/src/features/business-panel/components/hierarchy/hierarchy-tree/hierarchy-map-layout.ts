import type { OrganizationNode } from '../../../types/dynamicHierarchy.types';

export interface HierarchyMapPoint {
  x: number;
  y: number;
}

export type HierarchyMapPositions = Record<string, HierarchyMapPoint>;

const HORIZONTAL_GAP = 250;
const VERTICAL_GAP = 154;
const MAP_PADDING = 120;

function byPositionThenName(a: OrganizationNode, b: OrganizationNode) {
  return (a.position ?? 0) - (b.position ?? 0) || a.name.localeCompare(b.name);
}

/**
 * Creates a left-to-right tree layout. Parents are vertically centered over
 * their children, which keeps the first render readable while still allowing
 * every node to be freely repositioned afterwards.
 */
export function calculateHierarchyMapLayout(nodes: OrganizationNode[]): HierarchyMapPositions {
  if (nodes.length === 0) return {};

  const nodeIds = new Set(nodes.map((node) => node.id));
  const childrenByParent = new Map<string, OrganizationNode[]>();

  nodes.forEach((node) => {
    if (!node.parent_id || !nodeIds.has(node.parent_id)) return;
    const children = childrenByParent.get(node.parent_id) ?? [];
    children.push(node);
    childrenByParent.set(node.parent_id, children);
  });
  childrenByParent.forEach((children) => children.sort(byPositionThenName));

  const roots = nodes
    .filter((node) => !node.parent_id || !nodeIds.has(node.parent_id))
    .sort(byPositionThenName);
  const positions: HierarchyMapPositions = {};
  const visiting = new Set<string>();
  let nextLeaf = 0;

  const placeNode = (node: OrganizationNode, depth: number): number => {
    if (positions[node.id]) return positions[node.id].y;

    // Corrupt or legacy cycles should not make the organizational map hang.
    if (visiting.has(node.id)) {
      const y = MAP_PADDING + nextLeaf++ * VERTICAL_GAP;
      positions[node.id] = { x: MAP_PADDING + depth * HORIZONTAL_GAP, y };
      return y;
    }

    visiting.add(node.id);
    const childY = (childrenByParent.get(node.id) ?? [])
      .filter((child) => !visiting.has(child.id))
      .map((child) => placeNode(child, depth + 1));
    const y = childY.length > 0
      ? childY.reduce((total, value) => total + value, 0) / childY.length
      : MAP_PADDING + nextLeaf++ * VERTICAL_GAP;

    positions[node.id] = { x: MAP_PADDING + depth * HORIZONTAL_GAP, y };
    visiting.delete(node.id);
    return y;
  };

  roots.forEach((root) => placeNode(root, 0));

  // Keep orphaned/cyclic legacy rows visible instead of dropping them.
  nodes.filter((node) => !positions[node.id]).forEach((node) => placeNode(node, 0));

  return positions;
}

export function getHierarchyMapBounds(positions: HierarchyMapPositions) {
  const points = Object.values(positions);
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  return points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxX: Math.max(bounds.maxX, point.x),
      maxY: Math.max(bounds.maxY, point.y),
    }),
    { minX: points[0].x, minY: points[0].y, maxX: points[0].x, maxY: points[0].y },
  );
}
