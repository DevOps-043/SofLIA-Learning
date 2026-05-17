import { DynamicHierarchyService } from '../../../services/dynamicHierarchy.service';
import { findRootNode } from './hierarchy-node-actions';
import type { BusinessTranslator } from './types';
import type { useHierarchyTreeState } from './useHierarchyTreeState';

type HierarchyTreeState = ReturnType<typeof useHierarchyTreeState>;

export function useHierarchyTreeCommands(state: HierarchyTreeState, t: BusinessTranslator) {
  const confirmDeleteNode = () => {
    if (!state.pendingDeleteNode) return;

    const node = state.pendingDeleteNode;
    state.setPendingDeleteNode(null);

    DynamicHierarchyService.deleteNode(node.id)
      .then((res) => {
        if (res.success && state.selectedStructureId) {
          state.loadNodes(state.selectedStructureId);
        }
      })
      .catch(console.error);
  };

  const saveStructure = async (name: string) => {
    try {
      const res = await DynamicHierarchyService.createStructure(name);

      if (res.success) {
        await state.loadStructures();
      } else {
        state.setNodeActionError(t('hierarchy.saveStructureError') + (res.error ? `: ${res.error}` : ''));
      }
    } catch (err) {
      state.setNodeActionError(t('hierarchy.saveStructureError'));
      console.error(err);
    }
  };

  const openRootMembers = async () => {
    if (!state.selectedStructureId) return;

    try {
      const rootNode = await findRootNode(state.selectedStructureId, state.nodes);

      if (!rootNode) {
        state.setNodeActionError(t('hierarchy.noRootNode'));
        return;
      }

      state.setMemberModalNodeId(rootNode.id);
      state.setMemberModalNodeName(rootNode.name);
      state.setIsMemberModalOpen(true);
    } catch (err) {
      console.error('Error finding root node', err);
      state.setNodeActionError(t('hierarchy.noRootNode'));
    }
  };

  const initializeRootNode = async () => {
    if (!state.selectedStructureId) return;

    await DynamicHierarchyService.createNode({
      structure_id: state.selectedStructureId,
      name: t('hierarchy.defaultRootName'),
      type: 'root',
      parent_id: null,
    });
    await state.loadNodes(state.selectedStructureId);
  };

  return { confirmDeleteNode, initializeRootNode, openRootMembers, saveStructure };
}
