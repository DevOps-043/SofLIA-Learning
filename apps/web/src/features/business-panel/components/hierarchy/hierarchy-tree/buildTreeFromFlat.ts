import type { OrganizationNode } from '../../../types/dynamicHierarchy.types';

export function buildTreeFromFlat(nodes: OrganizationNode[]): OrganizationNode[] {
  const map = new Map<string, OrganizationNode>();
  const roots: OrganizationNode[] = [];

  nodes.forEach((node) => {
    map.set(node.id, { ...node, children: [] });
  });

  nodes.forEach((node) => {
    const nodeWithChildren = map.get(node.id);

    if (!nodeWithChildren) {
      return;
    }

    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)?.children?.push(nodeWithChildren);
    } else {
      roots.push(nodeWithChildren);
    }
  });

  return roots;
}
