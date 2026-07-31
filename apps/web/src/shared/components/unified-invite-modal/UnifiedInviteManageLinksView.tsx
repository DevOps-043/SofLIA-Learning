'use client';

import type { CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CalendarDays,
  Check,
  Copy,
  Link2,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  Users,
  X,
} from 'lucide-react';

import styles from './InviteViews.module.css';
import type { UnifiedInviteModalController, UnifiedInviteTheme } from './types';

interface UnifiedInviteManageLinksViewProps {
  controller: UnifiedInviteModalController;
  onClose: () => void;
  theme: UnifiedInviteTheme;
}

export function UnifiedInviteManageLinksView({
  controller,
  onClose,
}: UnifiedInviteManageLinksViewProps) {
  const {
    actionLoading,
    copiedId,
    fetchLinks,
    getInviteUrl,
    getStatusConfig,
    handleCopyLink,
    handleLinkAction,
    isLoadingLinks,
    links,
    linksError,
    openMenuId,
    roleLabels,
    setLinksError,
    setMode,
    setOpenMenuId,
    t,
  } = controller;

  return (
    <div className={styles.view}>
      <div className={styles.scrollArea}>
        <div className={styles.stack}>
          {linksError && (
            <motion.div animate={{ opacity: 1, y: 0 }} className={styles.alert} initial={{ opacity: 0, y: -8 }}>
              <AlertCircle aria-hidden="true" />
              <span>{linksError}</span>
              <button aria-label={t('users.buttons.close', 'Cerrar')} onClick={() => setLinksError(null)} type="button">
                <X aria-hidden="true" />
              </button>
            </motion.div>
          )}

          {isLoadingLinks ? (
            [1, 2, 3].map((item) => <div className={styles.skeleton} key={item} />)
          ) : links.length === 0 ? (
            <div className={styles.empty}>
              <div>
                <span className={styles.emptyIcon} aria-hidden="true"><Link2 /></span>
                <h3>{t('users.modals.manageLinks.empty.title', 'Sin enlaces activos')}</h3>
                <p>{t('users.modals.manageLinks.empty.subtitle', 'Crea un enlace para incorporar a varias personas con el mismo rol.')}</p>
                <button onClick={() => setMode('bulk')} type="button">
                  <Plus aria-hidden="true" />
                  {t('users.buttons.createLink', 'Crear enlace')}
                </button>
              </div>
            </div>
          ) : (
            links.map((link) => {
              const statusConfig = getStatusConfig(link.status);
              const rowStyle = { '--row-status': statusConfig.color } as CSSProperties;
              return (
                <motion.article
                  animate={{ opacity: 1, y: 0 }}
                  className={styles.linkRow}
                  initial={{ opacity: 0, y: 8 }}
                  key={link.id}
                  style={rowStyle}
                >
                  <span className={styles.linkIcon} aria-hidden="true"><Link2 /></span>
                  <div className={styles.linkInfo}>
                    <div className={styles.linkHeading}>
                      <h3>{link.name || t('users.modals.manageLinks.unnamed', 'Enlace sin nombre')}</h3>
                      <span className={styles.status}>{statusConfig.label}</span>
                    </div>
                    <div className={styles.linkMeta}>
                      <span><Users aria-hidden="true" />{link.current_uses}/{link.max_uses} usos</span>
                      <span><Shield aria-hidden="true" />{roleLabels[link.role as keyof typeof roleLabels]?.label || link.role}</span>
                      <span><CalendarDays aria-hidden="true" />{new Date(link.expires_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className={styles.linkUrl}>
                      <code>{getInviteUrl(link.token)}</code>
                      <button
                        aria-label={t('users.buttons.copy', 'Copiar enlace')}
                        className={styles.copyButton}
                        onClick={() => void handleCopyLink(link)}
                        type="button"
                      >
                        {copiedId === link.id ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                      </button>
                    </div>
                  </div>
                  <button
                    aria-label={t('users.buttons.actions', 'Acciones')}
                    className={styles.menuButton}
                    disabled={actionLoading === link.id}
                    onClick={() => setOpenMenuId(openMenuId === link.id ? null : link.id)}
                    type="button"
                  >
                    {actionLoading === link.id ? <RefreshCw className="animate-spin" aria-hidden="true" /> : <MoreHorizontal aria-hidden="true" />}
                  </button>

                  <AnimatePresence>
                    {openMenuId === link.id && (
                      <motion.div animate={{ opacity: 1, scale: 1, y: 0 }} className={styles.actionMenu} exit={{ opacity: 0, scale: 0.98, y: -5 }} initial={{ opacity: 0, scale: 0.98, y: -5 }}>
                        {link.status === 'active' && (
                          <button onClick={() => void handleLinkAction(link.id, 'pause')} type="button">
                            <Pause aria-hidden="true" />
                            {t('users.modals.manageLinks.actions.pause', 'Pausar enlace')}
                          </button>
                        )}
                        {link.status === 'paused' && (
                          <button onClick={() => void handleLinkAction(link.id, 'resume')} type="button">
                            <Play aria-hidden="true" />
                            {t('users.modals.manageLinks.actions.resume', 'Reanudar enlace')}
                          </button>
                        )}
                        <button onClick={() => void handleLinkAction(link.id, 'delete')} type="button">
                          <Trash2 aria-hidden="true" />
                          {t('users.modals.manageLinks.actions.delete', 'Eliminar enlace')}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.article>
              );
            })
          )}
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerSummary}>
          <button aria-label={t('users.buttons.refresh', 'Actualizar')} disabled={isLoadingLinks} onClick={() => void fetchLinks()} type="button">
            <RefreshCw className={isLoadingLinks ? 'animate-spin' : ''} aria-hidden="true" />
          </button>
          <span>{links.length} {links.length === 1 ? 'enlace' : 'enlaces'}</span>
        </div>
        <div className={styles.footerActions}>
          <button className={styles.secondary} onClick={onClose} type="button">
            {t('users.buttons.close', 'Cerrar')}
          </button>
          <button className={styles.primary} onClick={() => setMode('bulk')} type="button">
            <Plus aria-hidden="true" />
            {t('users.buttons.newLink', 'Nuevo enlace')}
          </button>
        </div>
      </footer>
    </div>
  );
}
