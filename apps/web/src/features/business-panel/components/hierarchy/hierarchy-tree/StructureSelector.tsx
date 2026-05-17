import { ChevronDown, Layout } from 'lucide-react';
import type { BusinessTranslator } from './types';
import type { useHierarchyTreeState } from './useHierarchyTreeState';

type HierarchyTreeState = ReturnType<typeof useHierarchyTreeState>;

interface StructureSelectorProps {
  state: HierarchyTreeState;
  t: BusinessTranslator;
}

export function StructureSelector({ state, t }: StructureSelectorProps) {
  const selectedStructure = state.structures.find((structure) => structure.id === state.selectedStructureId);

  return (
    <div className="space-y-4 flex-1">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 dark:text-white/30 block ml-1">
        {t('hierarchy.activeStructure')}
      </label>
      <div className="relative min-w-[280px] max-w-xs group">
        <button
          type="button"
          onClick={() => state.setIsDropdownOpen(!state.isDropdownOpen)}
          className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all duration-300 active:scale-[0.98] h-[58px]"
          style={{
            backgroundColor: 'var(--dropdown-bg, transparent)',
            borderColor: state.isDropdownOpen ? 'var(--accent-color, #0A2540)' : 'var(--border-color, rgba(0,0,0,0.1))',
            boxShadow: state.isDropdownOpen ? '0 0 20px rgba(0,212,179,0.15)' : 'none',
          }}
        >
          <style jsx>{`
            button { --dropdown-bg: #f8fafc; --border-color: #e2e8f0; --accent-color: #0A2540; }
            :global(.dark) button { --dropdown-bg: #1E2329; --border-color: rgba(255,255,255,0.1); --accent-color: #00D4B3; }
          `}</style>
          <Layout className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A2540] dark:text-[#00D4B3]" />
          <span className="text-sm font-bold text-[#0A2540] dark:text-white truncate">
            {selectedStructure?.name || t('hierarchy.selectStructure')}
            {selectedStructure?.is_default ? ` ${t('hierarchy.defaultBadge')}` : ''}
          </span>
          <ChevronDown className={`w-4 h-4 text-neutral-500 dark:text-white/30 transition-transform duration-300 ${state.isDropdownOpen ? 'rotate-180 opacity-100' : 'rotate-0'}`} />
        </button>

        {state.isDropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => state.setIsDropdownOpen(false)} />
            <div className="absolute top-full left-0 right-0 mt-3 rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#1E2329] shadow-2xl overflow-hidden z-50 py-2 backdrop-blur-3xl">
              {state.structures.map((structure) => (
                <button
                  key={structure.id}
                  onClick={() => {
                    state.setSelectedStructureId(structure.id);
                    state.setIsDropdownOpen(false);
                  }}
                  className={`w-full px-5 py-3.5 text-left text-sm font-bold transition-all flex items-center justify-between gap-3 ${state.selectedStructureId === structure.id
                    ? 'bg-blue-500/5 dark:bg-[#00D4B3]/10 text-[#0A2540] dark:text-[#00D4B3]'
                    : 'text-neutral-600 dark:text-white/60 hover:text-[#0A2540] dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-white/5'
                    }`}
                >
                  <span>{structure.name} {structure.is_default ? t('hierarchy.defaultBadge') : ''}</span>
                  {state.selectedStructureId === structure.id && <div className="w-1.5 h-1.5 rounded-full bg-[#0A2540] dark:bg-[#00D4B3]" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
