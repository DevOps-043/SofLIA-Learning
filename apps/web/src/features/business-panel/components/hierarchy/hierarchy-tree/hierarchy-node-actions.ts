import { DynamicHierarchyService } from '../../../services/dynamicHierarchy.service';
import type { OrganizationNode, OrganizationNodeProperties } from '../../../types/dynamicHierarchy.types';
import type { HierarchyNodeModalMode } from './types';

interface SaveHierarchyNodeParams {
  managerId?: string;
  mode: HierarchyNodeModalMode;
  name: string;
  properties?: OrganizationNodeProperties;
  selectedStructureId: string;
  targetNode?: OrganizationNode;
  type: string;
}

export async function saveHierarchyNode({
  managerId,
  mode,
  name,
  properties,
  selectedStructureId,
  targetNode,
  type,
}: SaveHierarchyNodeParams): Promise<void> {
  if (mode === 'edit' && targetNode) {
    await DynamicHierarchyService.updateNode(targetNode.id, { name, type, properties, manager_id: managerId });
    return;
  }

  await DynamicHierarchyService.createNode({
    structure_id: selectedStructureId,
    parent_id: targetNode?.id || null,
    name,
    type,
    properties,
    manager_id: managerId,
  });
}

export async function findRootNode(
  selectedStructureId: string,
  nodes: OrganizationNode[]
): Promise<OrganizationNode | undefined> {
  const existingRoot = nodes.find((node) => !node.parent_id);

  if (existingRoot) {
    return existingRoot;
  }

  const fetchedNodes = await DynamicHierarchyService.getTree(selectedStructureId);
  return fetchedNodes.find((node) => !node.parent_id);
}
