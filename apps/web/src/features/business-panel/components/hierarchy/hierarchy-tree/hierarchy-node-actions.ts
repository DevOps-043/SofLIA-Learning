import { DynamicHierarchyService } from '../../../services/dynamicHierarchy.service';
import type { OrganizationNode, OrganizationNodeProperties } from '../../../types/dynamicHierarchy.types';
import type { HierarchyNodeModalMode } from './types';

interface SaveHierarchyNodeParams {
  managerId?: string | null;
  mode: HierarchyNodeModalMode;
  name: string;
  orgSlug?: string | null;
  properties?: OrganizationNodeProperties;
  selectedStructureId: string;
  targetNode?: OrganizationNode;
  type: string;
}

export async function saveHierarchyNode({
  managerId,
  mode,
  name,
  orgSlug,
  properties,
  selectedStructureId,
  targetNode,
  type,
}: SaveHierarchyNodeParams): Promise<void> {
  if (mode === 'edit' && targetNode) {
    const result = await DynamicHierarchyService.updateNode(
      targetNode.id,
      { name, type, properties, manager_id: managerId },
      orgSlug,
    );
    if (!result.success) throw new Error(result.error || 'Unable to update hierarchy node');
    return;
  }

  const result = await DynamicHierarchyService.createNode({
    structure_id: selectedStructureId,
    parent_id: targetNode?.id || null,
    name,
    type,
    properties,
    manager_id: managerId ?? undefined,
  }, orgSlug);
  if (!result.success) throw new Error(result.error || 'Unable to create hierarchy node');
}

export async function findRootNode(
  selectedStructureId: string,
  nodes: OrganizationNode[],
  orgSlug?: string | null,
): Promise<OrganizationNode | undefined> {
  const existingRoot = nodes.find((node) => !node.parent_id);

  if (existingRoot) {
    return existingRoot;
  }

  const fetchedNodes = await DynamicHierarchyService.getTree(selectedStructureId, orgSlug);
  return fetchedNodes.find((node) => !node.parent_id);
}
