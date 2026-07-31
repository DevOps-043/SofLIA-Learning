'use client';

import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Link2, List, Mail, UserPlus, X } from 'lucide-react';

import { UnifiedInviteFormsView } from './UnifiedInviteFormsView';
import { UnifiedInviteManageLinksView } from './UnifiedInviteManageLinksView';
import { UnifiedInviteSuccessView } from './UnifiedInviteSuccessView';
import styles from './UnifiedInviteModal.module.css';
import type { UnifiedInviteModalProps } from './types';

export function UnifiedInviteModal({
  controller,
  isOpen,
  onClose,
  theme,
}: UnifiedInviteModalProps) {
  const { mode, setError, setMode, setStatus, status, t } = controller;
  const modalStyle = {
    '--invite-accent': theme.accentColor,
    '--invite-border': theme.borderColor,
    '--invite-input': theme.inputBg,
    '--invite-menu': theme.menuBg,
    '--invite-muted': theme.mutedText,
    '--invite-on-primary': theme.onPrimaryColor,
    '--invite-primary': theme.primaryColor,
    '--invite-surface': theme.surfaceColor,
    '--invite-text': theme.textColor,
  } as CSSProperties;

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          animate={{ opacity: 1 }}
          className={styles.overlay}
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onMouseDown={onClose}
          style={modalStyle}
        >
          <motion.section
            aria-labelledby="unified-invite-title"
            aria-modal="true"
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={styles.dialog}
            exit={{ opacity: 0, scale: 0.985, y: 12 }}
            initial={{ opacity: 0, scale: 0.975, y: 18 }}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className={styles.header}>
              <span className={styles.headerIcon} aria-hidden="true">
                <UserPlus />
              </span>

              <div className={styles.heading}>
                <p>{t('users.modals.unified.eyebrow', 'Gestión de acceso')}</p>
                <h2 id="unified-invite-title">
                  {t('users.modals.unified.title', 'Invitar usuarios')}
                </h2>
              </div>

              {status !== 'success' && (
                <nav aria-label={t('users.modals.unified.title', 'Invitar usuarios')} className={styles.tabs}>
                  {[
                    {
                      key: 'individual' as const,
                      label: t('users.modals.unified.tabs.individual', 'Individual'),
                      icon: Mail,
                    },
                    {
                      key: 'bulk' as const,
                      label: t('users.modals.unified.tabs.bulk', 'Enlace'),
                      icon: Link2,
                    },
                    {
                      key: 'manage' as const,
                      label: t('users.modals.unified.tabs.manage', 'Gestionar'),
                      icon: List,
                    },
                  ].map((tab) => (
                    <button
                      aria-current={mode === tab.key ? 'page' : undefined}
                      className={mode === tab.key ? styles.tabActive : styles.tab}
                      key={tab.key}
                      onClick={() => {
                        setMode(tab.key);
                        setError(null);
                        setStatus('idle');
                      }}
                      type="button"
                    >
                      <tab.icon aria-hidden="true" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              )}

              <button
                aria-label={t('users.buttons.close', 'Cerrar')}
                className={styles.close}
                onClick={onClose}
                type="button"
              >
                <X aria-hidden="true" />
              </button>
            </header>

            <div className={styles.content}>
              {status === 'success' ? (
                <UnifiedInviteSuccessView
                  controller={controller}
                  mode={mode === 'individual' ? 'individual' : 'bulk'}
                  onClose={onClose}
                  theme={theme}
                />
              ) : mode === 'manage' ? (
                <UnifiedInviteManageLinksView
                  controller={controller}
                  onClose={onClose}
                  theme={theme}
                />
              ) : (
                <UnifiedInviteFormsView
                  controller={controller}
                  mode={mode}
                  onClose={onClose}
                  theme={theme}
                />
              )}
            </div>
          </motion.section>

          {controller.openMenuId && (
            <button
              aria-label={t('users.buttons.close', 'Cerrar menú')}
              className={styles.menuDismiss}
              onClick={() => controller.setOpenMenuId(null)}
              type="button"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
