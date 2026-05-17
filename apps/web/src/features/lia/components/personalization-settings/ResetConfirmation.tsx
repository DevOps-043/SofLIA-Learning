import { useTranslation } from 'react-i18next';

export function ResetConfirmation(props: {
  onCancel: () => void;
  onConfirm: () => void;
  show: boolean;
}) {
  const { t } = useTranslation('common');

  if (!props.show) {
    return null;
  }

  return (
    <div className="px-6 py-3 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-700/30 flex items-center justify-between gap-4">
      <p className="text-sm text-amber-700 dark:text-amber-400">
        {t('liaPersonalization.confirmReset')}
      </p>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={props.onCancel} className="px-3 py-1.5 text-sm border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 rounded hover:bg-amber-100 dark:hover:bg-amber-800/30 transition-colors">
          {t('actions.cancel')}
        </button>
        <button onClick={props.onConfirm} className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors">
          {t('actions.confirm')}
        </button>
      </div>
    </div>
  );
}
