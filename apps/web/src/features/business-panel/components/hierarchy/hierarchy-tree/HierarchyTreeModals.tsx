import { MemberAssignmentModal } from '../MemberAssignmentModal';
import { NodeForm } from '../NodeForm';
import { StructureForm } from '../StructureForm';
import type { useHierarchyTreeState } from './useHierarchyTreeState';

type HierarchyTreeState = ReturnType<typeof useHierarchyTreeState>;

interface HierarchyTreeModalsProps {
  onSaveStructure: (name: string) => Promise<void>;
  state: HierarchyTreeState;
}

export function HierarchyTreeModals({ onSaveStructure, state }: HierarchyTreeModalsProps) {
  return (
    <>
      <StructureForm
        isOpen={state.showStructureModal}
        onClose={() => state.setShowStructureModal(false)}
        onSave={onSaveStructure}
      />

      <NodeForm
        isOpen={state.showNodeModal}
        onClose={() => state.setShowNodeModal(false)}
        onSave={state.handleNodeSave}
        mode={state.nodeModalMode}
        parentNode={state.nodeModalMode === 'create' ? state.targetNode : undefined}
        nodeToEdit={state.nodeModalMode === 'edit' ? state.targetNode : undefined}
      />

      {state.isMemberModalOpen && state.memberModalNodeId && (
        <MemberAssignmentModal
          isOpen={state.isMemberModalOpen}
          onClose={() => state.setIsMemberModalOpen(false)}
          nodeId={state.memberModalNodeId}
          nodeName={state.memberModalNodeName}
          onSuccess={() => {
            if (state.selectedStructureId) {
              void state.loadNodes(state.selectedStructureId);
            }
          }}
        />
      )}
    </>
  );
}
