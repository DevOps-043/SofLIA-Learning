import { ChevronRight, Link2, Send } from 'lucide-react';
import type { ModalStatus, UnifiedInviteModalController, UnifiedInviteTheme } from '../types';
import styles from './InviteForm.module.css';

interface InviteFooterProps {
  icon: 'link' | 'send';
  loadingLabel: string;
  modeLabel: string;
  onClose: () => void;
  status: ModalStatus;
  submitLabel: string;
  t: UnifiedInviteModalController['t'];
  theme: UnifiedInviteTheme;
}

export function InviteFooter({ icon, loadingLabel, modeLabel, onClose, status, submitLabel, t }: InviteFooterProps) {
  const Icon = icon === 'link' ? Link2 : Send;

  return (
    <footer className={styles.footer}>
      <div className={styles.footerMode}>
        <span><Icon aria-hidden="true" /></span>
        <span>{modeLabel}</span>
      </div>
      <div className={styles.footerActions}>
        <button className={styles.secondaryButton} disabled={status === 'loading'} onClick={onClose} type="button">
          {t('users.buttons.cancel', 'Cancelar')}
        </button>
        <button className={styles.primaryButton} disabled={status === 'loading'} type="submit">
          {status === 'loading' ? (
            <>
              <span className={styles.spinner} aria-hidden="true" />
              <span>{loadingLabel}</span>
            </>
          ) : (
            <>
              <span>{submitLabel}</span>
              <ChevronRight aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </footer>
  );
}
