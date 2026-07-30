import { useTranslation } from 'react-i18next';
import styles from './PersonalizationSettings.module.css';

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
    <div className={styles.resetConfirmation}>
      <p className={styles.resetCopy}>
        {t('liaPersonalization.confirmReset')}
      </p>
      <div className={styles.resetActions}>
        <button type="button" onClick={props.onCancel} className={styles.resetCancel}>
          {t('actions.cancel')}
        </button>
        <button type="button" onClick={props.onConfirm} className={styles.resetConfirm}>
          {t('actions.confirm')}
        </button>
      </div>
    </div>
  );
}
