import { useEffect, useRef } from 'react';
import { ChevronDown, Layout, Trash2 } from 'lucide-react';
import type { BusinessTranslator } from './types';
import type { useHierarchyTreeState } from './useHierarchyTreeState';
import styles from '../HierarchyExperience.module.css';

type HierarchyTreeState = ReturnType<typeof useHierarchyTreeState>;

interface StructureSelectorProps {
  state: HierarchyTreeState;
  t: BusinessTranslator;
}

export function StructureSelector({ state, t }: StructureSelectorProps) {
  const selectorRef = useRef<HTMLDivElement | null>(null);
  const selectedStructure = state.structures.find((structure) => structure.id === state.selectedStructureId);
  const canDelete = state.structures.length > 1;

  useEffect(() => {
    if (!state.isDropdownOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!selectorRef.current?.contains(event.target as Node)) {
        state.setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        state.setIsDropdownOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.isDropdownOpen, state.setIsDropdownOpen]);

  function handleDeleteClick(e: React.MouseEvent, structure: ReturnType<typeof useHierarchyTreeState>['structures'][number]) {
    e.stopPropagation();
    state.setIsDropdownOpen(false);
    state.setPendingDeleteStructure(structure);
  }

  return (
    <div className={styles.fieldGroup}>
      <span className={styles.fieldLabel}>
        {t('hierarchy.activeStructure')}
      </span>
      <div ref={selectorRef} className={styles.selectRoot}>
        <button
          type="button"
          onClick={() => state.setIsDropdownOpen(!state.isDropdownOpen)}
          className={styles.selectTrigger}
          data-open={state.isDropdownOpen}
          aria-haspopup="listbox"
          aria-expanded={state.isDropdownOpen}
          aria-controls="hierarchy-structure-options"
        >
          <Layout aria-hidden="true" />
          <span className={styles.selectValue}>
            {selectedStructure?.name || t('hierarchy.selectStructure')}
            {selectedStructure?.is_default ? ` ${t('hierarchy.defaultBadge')}` : ''}
          </span>
          <ChevronDown
            aria-hidden="true"
            style={{ transform: state.isDropdownOpen ? 'rotate(180deg)' : undefined }}
          />
        </button>

        {state.isDropdownOpen && (
            <div id="hierarchy-structure-options" className={styles.selectMenu} role="listbox">
              {state.structures.map((structure) => (
                <div
                  key={structure.id}
                  className={styles.selectOptionRow}
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={state.selectedStructureId === structure.id}
                    onClick={() => {
                      state.setSelectedStructureId(structure.id);
                      state.setIsDropdownOpen(false);
                    }}
                    className={`${styles.selectOption} ${state.selectedStructureId === structure.id ? styles.selectOptionActive : ''}`}
                  >
                    <span className="truncate">{structure.name} {structure.is_default ? t('hierarchy.defaultBadge') : ''}</span>
                    {state.selectedStructureId === structure.id ? <span className={styles.selectOptionDot} aria-hidden="true" /> : null}
                  </button>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteClick(e, structure)}
                      aria-label={`${t('hierarchy.deleteStructure')}: ${structure.name}`}
                      className={styles.dangerIconButton}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
            </div>
        )}
      </div>
    </div>
  );
}
