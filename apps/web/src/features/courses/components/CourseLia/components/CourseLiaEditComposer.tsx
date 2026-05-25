import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { CourseLiaThemeColors } from '../types';

interface CourseLiaEditComposerProps {
  editInputRef: React.RefObject<HTMLTextAreaElement>;
  editingValue: string;
  isLoading: boolean;
  onCancelEditing: () => void;
  onEditKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmitEditedMessage: () => void | Promise<void>;
  setEditingValue: (value: string) => void;
  themeColors: CourseLiaThemeColors;
}

export function CourseLiaEditComposer({
  editInputRef,
  editingValue,
  isLoading,
  onCancelEditing,
  onEditKeyDown,
  onSubmitEditedMessage,
  setEditingValue,
  themeColors,
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
        className="lia-input-reset lia-chat-edit-input"
        style={{ width: '100%', minWidth: '220px', maxWidth: '100%', resize: 'none', background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-bg-light)', fontSize: '14px', lineHeight: 1.5, padding: 0 }}
      />
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => void onSubmitEditedMessage()}
          disabled={!canSave}
          title={t('lia.saveEdit')}
          aria-label={t('lia.saveEdit')}
          style={{ background: 'transparent', border: 'none', cursor: canSave ? 'pointer' : 'not-allowed', padding: '4px', display: 'flex', alignItems: 'center', color: canSave ? themeColors.accentColor : 'rgba(255,255,255,0.5)' }}
        >
          <Check style={{ width: '14px', height: '14px' }} />
        </button>
        <button
          type="button"
          onClick={onCancelEditing}
          title={t('lia.cancelEdit')}
          aria-label={t('lia.cancelEdit')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.75)' }}
        >
          <X style={{ width: '14px', height: '14px' }} />
        </button>
      </div>
    </>
  );
}
