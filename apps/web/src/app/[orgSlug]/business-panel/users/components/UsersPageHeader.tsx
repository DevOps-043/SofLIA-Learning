'use client'

import { motion } from 'framer-motion'
import { Download, Mail, Plus, RefreshCw, Upload } from 'lucide-react'
import type { TFunction } from 'i18next'

import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { useMotionSafe } from '@/lib/utils/motion'

import styles from './UsersPanel.module.css'

interface UsersPageHeaderProps {
  t: TFunction
  onExportUsers: () => void
  onImportClick: () => void
  onInviteClick: () => void
  onAddClick: () => void
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function UsersPageHeader({ t, onExportUsers, onImportClick, onInviteClick, onAddClick, onRefresh, isRefreshing }: UsersPageHeaderProps) {
  const { disableHeavy, interfaceStaggerSeconds, interfaceTransition } = useMotionSafe()
  const {
    heroBackground,
    heroBorderColor,
  } = useBusinessPanelTheme()
  const labels = {
    refresh: translateLabel(t, 'users.buttons.refresh', 'common.refresh'),
    exportCsv: translateLabel(t, 'users.buttons.exportCsv', 'reportsAnalytics.actions.exportCsv'),
    import: translateLabel(t, 'users.buttons.import', 'importUsers.buttons.import'),
    invite: translateLabel(t, 'users.buttons.invite', 'users.buttons.sendInvite'),
    add: translateLabel(t, 'users.buttons.add', 'users.buttons.create'),
  }

  return (
    <motion.section
      id="tour-users-hero"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={interfaceTransition}
      className={styles.hero}
      style={{
        background: heroBackground,
        borderColor: heroBorderColor,
      }}
      aria-labelledby="users-page-title"
    >
      <div className={styles.heroAtmosphere} aria-hidden="true" />
      <div className={styles.heroRingLarge} aria-hidden="true" />
      <div className={styles.heroRingSmall} aria-hidden="true" />
      <div className={styles.heroDot} aria-hidden="true" />

      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>{t('sidebar.users')}</p>
        <motion.h1
          id="users-page-title"
          className={styles.heroTitle}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={interfaceTransition}
        >
          {t('users.title')}
        </motion.h1>
        <motion.p
          className={styles.heroDescription}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={interfaceTransition}
        >
          {t('users.subtitle')}
        </motion.p>
      </div>

      <div id="tour-users-actions" className={styles.heroActions}>
        {[
          { id: 'tour-users-refresh-button', icon: RefreshCw, label: labels.refresh, onClick: onRefresh ?? (() => {}), index: 0, spin: isRefreshing },
          { id: 'tour-users-export-button', icon: Download, label: labels.exportCsv, onClick: onExportUsers, index: 1 },
          { id: 'tour-users-import-button', icon: Upload, label: labels.import, onClick: onImportClick, index: 2 },
          { id: 'tour-users-invite-button', icon: Mail, label: labels.invite, onClick: onInviteClick, index: 3 },
        ].map(({ id, icon: Icon, label, onClick, index, spin }) => (
          <motion.button
            id={id}
            key={id}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              ...interfaceTransition,
              delay: disableHeavy ? 0 : Math.min(index * interfaceStaggerSeconds, 0.08),
            }}
            onClick={onClick}
            className={styles.heroButton}
            whileTap={disableHeavy ? undefined : { scale: 0.98 }}
          >
            <Icon className={spin ? 'animate-spin' : undefined} aria-hidden="true" />
            {label}
          </motion.button>
        ))}

        <motion.button
          id="tour-users-add-button"
          type="button"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            ...interfaceTransition,
            delay: disableHeavy ? 0 : Math.min(4 * interfaceStaggerSeconds, 0.08),
          }}
          onClick={onAddClick}
          className={styles.heroPrimaryButton}
          whileTap={disableHeavy ? undefined : { scale: 0.98 }}
        >
          <Plus aria-hidden="true" />
          <span>{labels.add}</span>
        </motion.button>
      </div>
    </motion.section>
  )
}

function translateLabel(t: TFunction, key: string, fallbackKey: string) {
  const value = t(key)
  if (typeof value === 'string' && value !== key) return value

  const fallback = t(fallbackKey)
  if (typeof fallback === 'string' && fallback !== fallbackKey) return fallback

  return key
}
