import { Plus, UserPlus } from 'lucide-react';
import type { BusinessTranslator } from './types';

interface HierarchyActionsProps {
  onNewStructure: () => void;
  onOpenMembers: () => void;
  t: BusinessTranslator;
}

export function HierarchyActions({ onNewStructure, onOpenMembers, t }: HierarchyActionsProps) {
  return (
    <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
      <button
        onClick={onOpenMembers}
        className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 hover:bg-neutral-200 dark:hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest text-[#0A2540] dark:text-white shadow-xl h-[58px]"
      >
        <UserPlus className="w-4 h-4" />
        <span>{t('hierarchy.members')}</span>
      </button>

      <button
        onClick={onNewStructure}
        className="flex items-center gap-3 px-8 py-4 rounded-2xl shadow-2xl transition-all hover:brightness-110 active:scale-95 text-[10px] font-black uppercase tracking-widest h-[58px] bg-[#0A2540] dark:bg-none !text-white dark:!text-[#0A2540]"
        style={{
          background: 'var(--btn-bg)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        }}
      >
        <style jsx>{`
          button { --btn-bg: #0A2540 !important; }
          :global(.dark) button { --btn-bg: linear-gradient(135deg, #00D4B3, #10B981) !important; }
        `}</style>
        <Plus className="w-4 h-4" strokeWidth={3} />
        <span>{t('hierarchy.newStructure')}</span>
      </button>
    </div>
  );
}
