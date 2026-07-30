import { useTranslation } from 'react-i18next';

import styles from '../CourseLiaPanel.module.css';

interface CourseLiaTypingIndicatorProps {
  stop: () => void;
}

export function CourseLiaTypingIndicator({
  stop,
}: CourseLiaTypingIndicatorProps) {
  const { t } = useTranslation('learn');

  return (
    <div className={styles.typing} aria-label={t('lia.typing')}>
      <span className={styles.typingDot} aria-hidden="true" />
      <span className={styles.typingDot} aria-hidden="true" />
      <span className={styles.typingDot} aria-hidden="true" />
      <button type="button" onClick={stop} title={t('lia.stopGeneration')} style={{ display: 'none' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <rect x="9" y="9" width="6" height="6" />
        </svg>
      </button>
    </div>
  );
}
