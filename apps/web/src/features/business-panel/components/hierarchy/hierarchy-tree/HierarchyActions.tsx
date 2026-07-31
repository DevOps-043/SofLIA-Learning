import { Plus, UserPlus } from 'lucide-react';
import type { BusinessTranslator } from './types';
import styles from '../HierarchyExperience.module.css';

interface HierarchyActionsProps {
  onNewStructure: () => void;
  onOpenMembers: () => void;
  t: BusinessTranslator;
}

export function HierarchyActions({ onNewStructure, onOpenMembers, t }: HierarchyActionsProps) {
  return (
    <div className={styles.toolbarActions}>
      <button
        type="button"
        onClick={onOpenMembers}
        className={styles.secondaryButton}
      >
        <UserPlus aria-hidden="true" />
        <span>{t('hierarchy.members')}</span>
      </button>

      <button
        type="button"
        onClick={onNewStructure}
        className={styles.primaryButton}
      >
        <Plus aria-hidden="true" />
        <span>{t('hierarchy.newStructure')}</span>
      </button>
    </div>
  );
}
