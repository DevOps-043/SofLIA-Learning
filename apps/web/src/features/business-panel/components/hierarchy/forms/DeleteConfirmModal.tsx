import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';

interface DeleteConfirmProps {
  isLoading?: boolean;
  isOpen: boolean;
  itemName: string;
  message: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
}

export function DeleteConfirmModal({
  isLoading,
  isOpen,
  itemName,
  message,
  onClose,
  onConfirm,
  title,
}: DeleteConfirmProps) {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation('business');
  const { t: tc } = useTranslation('common');

  useEffect(() => {
    setConfirmText('');
    setError(null);
  }, [isOpen]);

  const handleConfirm = async () => {
    if (confirmText !== itemName) {
      setError(t('hierarchy.deleteConfirmError', { name: itemName }));
      return;
    }

    try {
      await onConfirm();
      onClose();
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : t('hierarchy.errorDelete'));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} isLoading={isLoading} size="md">
      <div className="space-y-4">
        <p className="text-neutral-600 dark:text-neutral-400">{message}</p>
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            {t('hierarchy.deleteWarning')} <strong>{itemName}</strong> {t('hierarchy.deleteWarningEnd')}
          </p>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <input
          type="text"
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
          placeholder={itemName}
          disabled={isLoading}
        />
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-sm font-medium">{tc('actions.cancel')}</button>
          <button onClick={handleConfirm} disabled={isLoading || confirmText !== itemName} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">{isLoading ? tc('actions.deleting') : tc('actions.delete')}</button>
        </div>
      </div>
    </Modal>
  );
}
