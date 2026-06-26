import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useCallback, useEffect, useState } from 'react';
import { DynamicHierarchyService } from '../../../services/dynamicHierarchy.service';
import type { OrganizationNode, OrganizationStructure } from '../../../types/dynamicHierarchy.types';
import { buildTreeFromFlat } from './buildTreeFromFlat';
import { findRootNode, saveHierarchyNode } from './hierarchy-node-actions';
import type { BusinessTranslator, HierarchyNodeModalMode, HierarchyNodeSavePayload } from './types';

export function useHierarchyTreeState(
  initialStructureId: string | undefined,
  t: BusinessTranslator,
  orgSlug?: string | null,
) {
  const [structures, setStructures] = useState<OrganizationStructure[]>([]);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(initialStructureId || null);
  const [nodes, setNodes] = useState<OrganizationNode[]>([]);
  const [treeRoots, setTreeRoots] = useState<OrganizationNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [pendingDeleteNode, setPendingDeleteNode] = useState<OrganizationNode | null>(null);
  const [pendingDeleteStructure, setPendingDeleteStructure] = useState<OrganizationStructure | null>(null);
  const [nodeActionError, setNodeActionError] = useState<string | null>(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberModalNodeId, setMemberModalNodeId] = useState<string | null>(null);
  const [memberModalNodeName, setMemberModalNodeName] = useState('');
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [nodeModalMode, setNodeModalMode] = useState<HierarchyNodeModalMode>('create');
  const [targetNode, setTargetNode] = useState<OrganizationNode | undefined>();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const loadStructures = useCallback(async () => {
    try {
      const data = await DynamicHierarchyService.getStructures(orgSlug);
      setStructures(data);

      if (data.length > 0) {
        const fallbackId = (data.find((structure) => structure.is_default) || data[0]).id;
        const loadedIds = new Set(data.map((s) => s.id));
        setSelectedStructureId((currentStructureId) =>
          currentStructureId && loadedIds.has(currentStructureId) ? currentStructureId : fallbackId,
        );
      }
    } catch (err) {
      setError(t('hierarchy.loadStructuresError'));
      techDebtLogger.error(err);
    }
  }, [orgSlug, t]);

  const loadNodes = useCallback(async (structureId: string) => {
    setIsLoading(true);

    try {
      const data = await DynamicHierarchyService.getTree(structureId, orgSlug);
      setNodes(data);
      setTreeRoots(buildTreeFromFlat(data));
    } catch (err) {
      setError(t('hierarchy.loadHierarchyError'));
      techDebtLogger.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [orgSlug, t]);

  useEffect(() => {
    void loadStructures();
  }, [loadStructures]);

  useEffect(() => {
    if (selectedStructureId) {
      void loadNodes(selectedStructureId);
    }
  }, [loadNodes, selectedStructureId]);

  const openNodeModal = (mode: HierarchyNodeModalMode, node?: OrganizationNode) => {
    setTargetNode(node);
    setNodeModalMode(mode);
    setShowNodeModal(true);
  };

  const handleNodeSave = async (name: string, type: string, properties?: HierarchyNodeSavePayload['properties'], managerId?: string) => {
    if (!selectedStructureId) return;

    try {
      await saveHierarchyNode({ managerId, mode: nodeModalMode, name, orgSlug, properties, selectedStructureId, targetNode, type });
      await loadNodes(selectedStructureId);
      setShowNodeModal(false);
    } catch (err) {
      techDebtLogger.error(err);
      setNodeActionError(t('hierarchy.saveNodeError'));
    }
  };

  return {
    error, handleNodeSave, isDropdownOpen, isLoading, isMemberModalOpen, loadNodes, loadStructures,
    memberModalNodeId, memberModalNodeName, nodeActionError, nodeModalMode, nodes, orgSlug,
    openNodeModal, pendingDeleteNode, pendingDeleteStructure, selectedStructureId, setIsDropdownOpen,
    setIsMemberModalOpen, setMemberModalNodeId, setMemberModalNodeName, setNodeActionError,
    setPendingDeleteNode, setPendingDeleteStructure, setSelectedStructureId, setShowNodeModal,
    setShowStructureModal, showNodeModal, showStructureModal,
    structures, targetNode, treeRoots,
  };
}
