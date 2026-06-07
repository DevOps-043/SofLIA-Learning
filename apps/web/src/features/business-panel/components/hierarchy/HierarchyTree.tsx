import React from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { HierarchyActions } from './hierarchy-tree/HierarchyActions';
import { HierarchyInlineAlerts } from './hierarchy-tree/HierarchyInlineAlerts';
import { HierarchyTreeBody } from './hierarchy-tree/HierarchyTreeBody';
import { HierarchyTreeModals } from './hierarchy-tree/HierarchyTreeModals';
import { StructureSelector } from './hierarchy-tree/StructureSelector';
import { useHierarchyTreeCommands } from './hierarchy-tree/useHierarchyTreeCommands';
import { useHierarchyTreeState } from './hierarchy-tree/useHierarchyTreeState';

interface HierarchyTreeProps {
  initialStructureId?: string;
}

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({ initialStructureId }) => {
  const { t } = useTranslation('business');
  const { t: tc } = useTranslation('common');
  const params = useParams();
  const orgSlug = params?.orgSlug as string | undefined;
  const state = useHierarchyTreeState(initialStructureId, t, orgSlug);
  const commands = useHierarchyTreeCommands(state, t);

  return (
    <div className="space-y-8 min-h-[500px]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-neutral-200 dark:border-white/5">
        <StructureSelector state={state} t={t} />
        <HierarchyActions
          onNewStructure={() => state.setShowStructureModal(true)}
          onOpenMembers={commands.openRootMembers}
          t={t}
        />
      </div>

      <HierarchyInlineAlerts
        onConfirmDeleteNode={commands.confirmDeleteNode}
        state={state}
        t={t}
        tc={tc}
      />

      <div className="relative">
        <HierarchyTreeBody
          onInitializeRootNode={commands.initializeRootNode}
          state={state}
          t={t}
        />
      </div>

      <HierarchyTreeModals onSaveStructure={commands.saveStructure} state={state} />
    </div>
  );
};
