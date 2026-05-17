import type { BusinessTranslator, CommonTranslator } from './types';
import type { useHierarchyTreeState } from './useHierarchyTreeState';

type HierarchyTreeState = ReturnType<typeof useHierarchyTreeState>;

interface HierarchyInlineAlertsProps {
  onConfirmDeleteNode: () => void;
  state: HierarchyTreeState;
  t: BusinessTranslator;
  tc: CommonTranslator;
}

export function HierarchyInlineAlerts({ onConfirmDeleteNode, state, t, tc }: HierarchyInlineAlertsProps) {
  return (
    <>
      {state.pendingDeleteNode && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between gap-3">
          <p className="text-sm text-red-700 dark:text-red-400">
            {t('hierarchy.confirmDeleteNode', { name: state.pendingDeleteNode.name })}
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => state.setPendingDeleteNode(null)} className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded hover:bg-red-50 transition-colors">
              {tc('actions.cancel')}
            </button>
            <button onClick={onConfirmDeleteNode} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
              {tc('actions.delete')}
            </button>
          </div>
        </div>
      )}
      {state.nodeActionError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{state.nodeActionError}</p>
        </div>
      )}
    </>
  );
}
