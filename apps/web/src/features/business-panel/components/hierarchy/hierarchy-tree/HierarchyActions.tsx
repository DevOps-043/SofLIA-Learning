import { Plus, UserPlus } from 'lucide-react';
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme';
import type { BusinessTranslator } from './types';

interface HierarchyActionsProps {
  onNewStructure: () => void;
  onOpenMembers: () => void;
  t: BusinessTranslator;
}

export function HierarchyActions({ onNewStructure, onOpenMembers, t }: HierarchyActionsProps) {
  const theme = useBusinessPanelTheme();

  return (
    <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
      <button
        onClick={onOpenMembers}
        className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 hover:bg-neutral-200 dark:hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest shadow-xl h-[58px]"
        style={{ color: theme.actionColor }}
      >
        <UserPlus className="w-4 h-4" />
        <span>{t('hierarchy.members')}</span>
      </button>

      <button
        onClick={onNewStructure}
        className="flex items-center gap-3 px-8 py-4 rounded-2xl shadow-2xl transition-all hover:brightness-110 active:scale-95 text-[10px] font-black uppercase tracking-widest h-[58px]"
        style={{
          background: theme.actionColor,
          color: theme.onActionColor,
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        }}
      >
        <Plus className="w-4 h-4" strokeWidth={3} />
        <span>{t('hierarchy.newStructure')}</span>
      </button>
    </div>
  );
}
