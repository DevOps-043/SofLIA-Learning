'use client';

import { motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';

import styles from './InviteViews.module.css';
import type { UnifiedInviteModalController, UnifiedInviteTheme } from './types';

interface UnifiedInviteSuccessViewProps {
  controller: UnifiedInviteModalController;
  mode: 'bulk' | 'individual';
  onClose: () => void;
  theme: UnifiedInviteTheme;
}

export function UnifiedInviteSuccessView({
  controller,
  mode,
  onClose,
}: UnifiedInviteSuccessViewProps) {
  const {
    copied,
    createdLink,
    getInviteUrl,
    handleCopy,
    handleCreateAnother,
    roleLabels,
    successEmail,
    t,
  } = controller;

  const isIndividual = mode === 'individual';

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className={styles.view} initial={{ opacity: 0, y: 10 }}>
      <div className={styles.scrollArea}>
        <div className={styles.success}>
          <span className={styles.successIcon} aria-hidden="true"><Check /></span>
          <h3>
            {isIndividual
              ? t('users.modals.invite.success.title', 'Invitación enviada')
              : t('users.modals.bulkInvite.success.title', 'Enlace preparado')}
          </h3>
          <p>
            {isIndividual
              ? t('users.modals.invite.success.message', 'El acceso fue enviado correctamente a la persona indicada.')
              : t('users.modals.bulkInvite.success.subtitle', 'Comparte este enlace con las personas que deben incorporarse.')}
          </p>

          <div className={styles.resultBlock}>
            <div>
              <span>{isIndividual ? 'Destinatario' : 'Enlace de invitación'}</span>
              {isIndividual ? <strong>{successEmail}</strong> : <code>{getInviteUrl()}</code>}
            </div>
            {!isIndividual && (
              <button aria-label={t('users.buttons.copy', 'Copiar enlace')} onClick={() => void handleCopy()} type="button">
                {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              </button>
            )}
          </div>

          {!isIndividual && createdLink && (
            <div className={styles.resultStats}>
              <div className={styles.resultStat}>
                <span>{t('users.modals.bulkInvite.success.maxUsers', 'Registros')}</span>
                <strong>{createdLink.max_uses}</strong>
              </div>
              <div className={styles.resultStat}>
                <span>{t('users.modals.bulkInvite.success.role', 'Rol')}</span>
                <strong>{roleLabels[createdLink.role as keyof typeof roleLabels]?.label || createdLink.role}</strong>
              </div>
              <div className={styles.resultStat}>
                <span>{t('users.modals.bulkInvite.success.expires', 'Vencimiento')}</span>
                <strong>{new Date(createdLink.expires_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className={styles.footer}>
        <div />
        <div className={styles.footerActions}>
          {!isIndividual && (
            <button className={styles.secondary} onClick={handleCreateAnother} type="button">
              {t('users.buttons.createAnother', 'Crear otro')}
            </button>
          )}
          <button className={styles.primary} onClick={onClose} type="button">
            {t('users.buttons.done', 'Finalizar')}
          </button>
        </div>
      </footer>
    </motion.div>
  );
}
