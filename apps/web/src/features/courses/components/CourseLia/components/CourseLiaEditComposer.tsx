import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import styles from '../CourseLiaPanel.module.css';

interface CourseLiaEditComposerProps {
  editInputRef: React.RefObject<HTMLTextAreaElement>;
  editingValue: string;
  isLoading: boolean;
  onCancelEditing: () => void;
  onEditKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmitEditedMessage: () => void | Promise<void>;
  setEditingValue: (value: string) => void;
}

export function CourseLiaEditComposer({
  editInputRef,
  editingValue,
  isLoading,
  onCancelEditing,
  onEditKeyDown,
  onSubmitEditedMessage,
  setEditingValue,
}: CourseLiaEditComposerProps) {
  const { t } = useTranslation('learn');
  const canSave = Boolean(editingValue.trim()) && !isLoading;

  return (
    <>
      <textarea
        ref={editInputRef}
        value={editingValue}
        onChange={(event) => setEditingValue(event.target.value)}
        onKeyDown={onEditKeyDown}
        rows={1}
        className={`lia-input-reset lia-chat-edit-input ${styles.editComposer}`}
      />
      <div className={styles.editActions}>
        <button
          type="button"
          onClick={() => void onSubmitEditedMessage()}
          disabled={!canSave}
          title={t('lia.saveEdit')}
          aria-label={t('lia.saveEdit')}
          className={styles.editAction}
        >
          <Check style={{ width: '14px', height: '14px' }} />
        </button>
        <button
          type="button"
          onClick={onCancelEditing}
          title={t('lia.cancelEdit')}
          aria-label={t('lia.cancelEdit')}
          className={styles.editAction}
        >
          <X style={{ width: '14px', height: '14px' }} />
        </button>
      </div>
    </>
  );
}
