import { Network, Settings } from 'lucide-react';
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme';
import { NodeItem } from '../NodeItem';
import type { BusinessTranslator } from './types';
import type { useHierarchyTreeState } from './useHierarchyTreeState';

type HierarchyTreeState = ReturnType<typeof useHierarchyTreeState>;

interface HierarchyTreeBodyProps {
  onInitializeRootNode: () => Promise<void>;
  state: HierarchyTreeState;
  t: BusinessTranslator;
}

export function HierarchyTreeBody({ onInitializeRootNode, state, t }: HierarchyTreeBodyProps) {
  const theme = useBusinessPanelTheme();

  if (state.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 opacity-30">
        <div className="w-10 h-10 border-4 border-neutral-200 dark:border-white/10 rounded-full animate-spin" style={{ borderTopColor: theme.actionColor }} />
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.actionColor }}>{t('hierarchy.syncing')}</span>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-center">
        <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 mx-auto">
          <Settings className="w-8 h-8 text-red-500" />
        </div>
        <span className="text-sm font-bold text-red-500 block">{state.error}</span>
      </div>
    );
  }

  if (state.treeRoots.length === 0) {
    return <EmptyHierarchyState onInitializeRootNode={onInitializeRootNode} t={t} />;
  }

  return (
    <div className="space-y-1">
      {state.treeRoots.map((root) => (
        <NodeItem
          key={root.id}
          node={root}
          level={0}
          onAddChild={(node) => state.openNodeModal('create', node)}
          onEdit={(node) => state.openNodeModal('edit', node)}
          onDelete={(node) => {
            state.setNodeActionError(null);
            state.setPendingDeleteNode(node);
          }}
        />
      ))}
    </div>
  );
}

function EmptyHierarchyState({ onInitializeRootNode, t }: Pick<HierarchyTreeBodyProps, 'onInitializeRootNode' | 't'>) {
  const theme = useBusinessPanelTheme();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-8">
      <div className="w-24 h-24 rounded-[2.5rem] bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
        <Network className="w-12 h-12 text-neutral-300 dark:text-white/10" />
      </div>
      <div className="space-y-3">
        <h3 className="text-xl font-black italic tracking-tight uppercase" style={{ color: theme.actionColor }}>{t('hierarchy.emptyStructureTitle')}</h3>
        <p className="text-xs font-semibold text-neutral-400 dark:text-white/30 max-w-xs mx-auto uppercase tracking-wide leading-relaxed">
          {t('hierarchy.emptyStructureDesc')}
        </p>
      </div>
      <button onClick={onInitializeRootNode} className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-2xl active:scale-95" style={{ backgroundColor: theme.actionColor, color: theme.onActionColor }}>
        {t('hierarchy.initializeGeneral')}
      </button>
    </div>
  );
}
