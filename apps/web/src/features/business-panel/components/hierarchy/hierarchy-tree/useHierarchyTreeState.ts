import { useCallback, useEffect, useState } from 'react';
import { DynamicHierarchyService } from '../../../services/dynamicHierarchy.service';
import type { OrganizationNode, OrganizationStructure } from '../../../types/dynamicHierarchy.types';
import { buildTreeFromFlat } from './buildTreeFromFlat';
import { findRootNode, saveHierarchyNode } from './hierarchy-node-actions';
import type { BusinessTranslator, HierarchyNodeModalMode, HierarchyNodeSavePayload } from './types';

export function useHierarchyTreeState(initialStructureId: string | undefined, t: BusinessTranslator) {
  const [structures, setStructures] = useState<OrganizationStructure[]>([]);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(initialStructureId || null);
  const [nodes, setNodes] = useState<OrganizationNode[]>([]);
  const [treeRoots, setTreeRoots] = useState<OrganizationNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [pendingDeleteNode, setPendingDeleteNode] = useState<OrganizationNode | null>(null);
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
      const data = await DynamicHierarchyService.getStructures();
      setStructures(data);

      if (data.length > 0) {
        const defaultStructureId = (data.find((structure) => structure.is_default) || data[0]).id;
        setSelectedStructureId((currentStructureId) => currentStructureId || defaultStructureId);
      }
    } catch (err) {
      setError(t('hierarchy.loadStructuresError'));
      console.error(err);
    }
  }, [t]);

  const loadNodes = useCallback(async (structureId: string) => {
    setIsLoading(true);

    try {
      const data = await DynamicHierarchyService.getTree(structureId);
      setNodes(data);
      setTreeRoots(buildTreeFromFlat(data));
    } catch (err) {
      setError(t('hierarchy.loadHierarchyError'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

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
      await saveHierarchyNode({ managerId, mode: nodeModalMode, name, properties, selectedStructureId, targetNode, type });
      await loadNodes(selectedStructureId);
      setShowNodeModal(false);
    } catch (err) {
      console.error(err);
      setNodeActionError(t('hierarchy.saveNodeError'));
    }
  };

  return {
    error, handleNodeSave, isDropdownOpen, isLoading, isMemberModalOpen, loadNodes, loadStructures,
    memberModalNodeId, memberModalNodeName, nodeActionError, nodeModalMode, nodes,
    openNodeModal, pendingDeleteNode, selectedStructureId, setIsDropdownOpen,
    setIsMemberModalOpen, setMemberModalNodeId, setMemberModalNodeName, setNodeActionError,
    setPendingDeleteNode, setSelectedStructureId, setShowNodeModal, setShowStructureModal, showNodeModal, showStructureModal,
    structures, targetNode, treeRoots,
  };
}
