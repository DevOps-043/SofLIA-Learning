import { ChevronDown, Layout, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme';
import type { BusinessTranslator } from './types';
import type { useHierarchyTreeState } from './useHierarchyTreeState';

type HierarchyTreeState = ReturnType<typeof useHierarchyTreeState>;

interface StructureSelectorProps {
  state: HierarchyTreeState;
  t: BusinessTranslator;
}

export function StructureSelector({ state, t }: StructureSelectorProps) {
  const selectedStructure = state.structures.find((structure) => structure.id === state.selectedStructureId);
  const theme = useBusinessPanelTheme();
  const canDelete = state.structures.length > 1;

  function handleDeleteClick(e: React.MouseEvent, structure: ReturnType<typeof useHierarchyTreeState>['structures'][number]) {
    e.stopPropagation();
    state.setIsDropdownOpen(false);
    state.setPendingDeleteStructure(structure);
  }

  return (
    <div className="space-y-4 flex-1">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] block ml-1" style={{ color: theme.mutedTextColor }}>
        {t('hierarchy.activeStructure')}
      </label>
      <div className="relative min-w-[280px] max-w-xs group">
        <button
          type="button"
          onClick={() => state.setIsDropdownOpen(!state.isDropdownOpen)}
          className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all duration-300 active:scale-[0.98] h-[58px]"
          style={{
            backgroundColor: theme.inputBg,
            borderColor: state.isDropdownOpen ? theme.accentColor : theme.borderColor,
            boxShadow: state.isDropdownOpen ? `0 0 20px color-mix(in srgb, ${theme.accentColor} 15%, transparent)` : 'none',
          }}
        >
          <Layout className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme.primaryColor }} />
          <span className="text-sm font-bold truncate" style={{ color: theme.textColor }}>
            {selectedStructure?.name || t('hierarchy.selectStructure')}
            {selectedStructure?.is_default ? ` ${t('hierarchy.defaultBadge')}` : ''}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${state.isDropdownOpen ? 'rotate-180 opacity-100' : 'rotate-0'}`} style={{ color: theme.mutedTextColor }} />
        </button>

        {state.isDropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => state.setIsDropdownOpen(false)} />
            <div className="absolute top-full left-0 right-0 mt-3 rounded-2xl border shadow-2xl overflow-hidden z-50 py-2 backdrop-blur-3xl" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
              {state.structures.map((structure) => (
                <div
                  key={structure.id}
                  className="flex items-center gap-1 group/item hover:bg-neutral-50 dark:hover:bg-white/5 transition-all"
                  style={{
                    backgroundColor: state.selectedStructureId === structure.id ? theme.actionSurface : 'transparent',
                  }}
                >
                  <button
                    onClick={() => {
                      state.setSelectedStructureId(structure.id);
                      state.setIsDropdownOpen(false);
                    }}
                    className="flex-1 px-5 py-3.5 text-left text-sm font-bold flex items-center justify-between gap-3"
                    style={{
                      color: state.selectedStructureId === structure.id ? theme.primaryColor : theme.textColor,
                    }}
                  >
                    <span className="truncate">{structure.name} {structure.is_default ? t('hierarchy.defaultBadge') : ''}</span>
                    {state.selectedStructureId === structure.id && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: theme.accentColor }} />}
                  </button>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteClick(e, structure)}
                      title={t('hierarchy.deleteStructure')}
                      className="opacity-0 group-hover/item:opacity-100 transition-opacity p-2 mr-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
