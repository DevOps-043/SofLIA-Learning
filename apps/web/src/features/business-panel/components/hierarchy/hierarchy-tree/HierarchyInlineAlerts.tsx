import { AlertTriangle } from 'lucide-react';
import type { BusinessTranslator, CommonTranslator } from './types';
import type { useHierarchyTreeState } from './useHierarchyTreeState';
import styles from '../HierarchyExperience.module.css';

type HierarchyTreeState = ReturnType<typeof useHierarchyTreeState>;

interface HierarchyInlineAlertsProps {
  onConfirmDeleteNode: () => void;
  onConfirmDeleteStructure: () => void;
  state: HierarchyTreeState;
  t: BusinessTranslator;
  tc: CommonTranslator;
}

export function HierarchyInlineAlerts({ onConfirmDeleteNode, onConfirmDeleteStructure, state, t, tc }: HierarchyInlineAlertsProps) {
  return (
    <div className={styles.inlineAlerts} aria-live="polite">
      {state.pendingDeleteNode && (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          <AlertTriangle aria-hidden="true" />
          <p className={styles.alertCopy}>
            {t('hierarchy.confirmDeleteNode', { name: state.pendingDeleteNode.name })}
          </p>
          <div className={styles.alertActions}>
            <button type="button" onClick={() => state.setPendingDeleteNode(null)} className={styles.compactButton}>
              {tc('actions.cancel')}
            </button>
            <button type="button" onClick={onConfirmDeleteNode} className={styles.compactDangerButton}>
              {tc('actions.delete')}
            </button>
          </div>
        </div>
      )}
      {state.pendingDeleteStructure && (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          <AlertTriangle aria-hidden="true" />
          <p className={styles.alertCopy}>
            {t('hierarchy.confirmDeleteStructure', { name: state.pendingDeleteStructure.name })}
          </p>
          <div className={styles.alertActions}>
            <button type="button" onClick={() => state.setPendingDeleteStructure(null)} className={styles.compactButton}>
              {tc('actions.cancel')}
            </button>
            <button type="button" onClick={onConfirmDeleteStructure} className={styles.compactDangerButton}>
              {tc('actions.delete')}
            </button>
          </div>
        </div>
      )}
      {state.nodeActionError && (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          <AlertTriangle aria-hidden="true" />
          <p className={styles.alertCopy}>{state.nodeActionError}</p>
          <button type="button" onClick={() => state.setNodeActionError(null)} className={styles.compactButton}>
            {tc('actions.close')}
          </button>
        </div>
      )}
    </div>
  );
}
