import { Loader2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ORG_ACCENT = 'var(--org-accent-color, var(--color-accent))';

export function FooterActions(props: {
  isSaving: boolean;
  onClose: () => void;
  onReset: () => void;
  onSave: () => void;
}) {
  const { t } = useTranslation('common');

  return (
    <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-500/30">
      <button
        onClick={props.onReset}
        disabled={props.isSaving}
        className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white transition-colors disabled:opacity-50"
      >
        {t('actions.retry')}
      </button>
      <div className="flex items-center gap-3">
        <button
          onClick={props.onClose}
          className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white transition-colors"
        >
          {t('actions.cancel')}
        </button>
        <button
          onClick={props.onSave}
          disabled={props.isSaving}
          style={{ backgroundColor: ORG_ACCENT }}
          className="px-6 py-2 text-white rounded-lg transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          {props.isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('actions.saving')}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {t('actions.save')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
