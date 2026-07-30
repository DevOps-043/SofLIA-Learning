import { Loader2, RotateCcw, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './PersonalizationSettings.module.css';

export function FooterActions(props: {
  isSaving: boolean;
  onClose: () => void;
  onReset: () => void;
  onSave: () => void;
}) {
  const { t } = useTranslation('common');

  return (
    <footer className={styles.footer}>
      <button
        type="button"
        onClick={props.onReset}
        disabled={props.isSaving}
        className={styles.resetButton}
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        {t('actions.retry')}
      </button>
      <div className={styles.footerGroup}>
        <button
          type="button"
          onClick={props.onClose}
          className={styles.secondaryButton}
        >
          {t('actions.cancel')}
        </button>
        <button
          type="button"
          onClick={props.onSave}
          disabled={props.isSaving}
          className={styles.primaryButton}
        >
          {props.isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t('actions.saving')}
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              {t('actions.save')}
            </>
          )}
        </button>
      </div>
    </footer>
  );
}
