'use client'

import { motion } from 'framer-motion'
import { Download, Mail, Plus, RefreshCw, Sparkles, Upload } from 'lucide-react'
import type { TFunction } from 'i18next'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { useMotionSafe } from '@/lib/utils/motion'

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
    accentColor,
    primaryColor,
    onPrimaryColor,
    heroBackground,
    heroBorderColor,
    inverseTextColor,
    inverseSubtextColor,
    inverseSurface,
    inverseBorderColor,
  } = useBusinessPanelTheme()
  const labels = {
    refresh: translateLabel(t, 'users.buttons.refresh', 'common.refresh'),
    exportCsv: translateLabel(t, 'users.buttons.exportCsv', 'reportsAnalytics.actions.exportCsv'),
    import: translateLabel(t, 'users.buttons.import', 'importUsers.buttons.import'),
    invite: translateLabel(t, 'users.buttons.invite', 'users.buttons.sendInvite'),
    add: translateLabel(t, 'users.buttons.add', 'users.buttons.create'),
  }

  return (
    <motion.div
      id="tour-users-hero"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={interfaceTransition}
      className="relative overflow-hidden rounded-2xl px-5 py-4 sm:px-6 sm:py-5"
      style={{
        background: heroBackground,
        border: `1px solid ${heroBorderColor}`,
      }}
    >
      {/* Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, ${inverseTextColor} 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {!disableHeavy ? (
        <>
          <div
            className="absolute top-10 right-20 w-2 h-2 rounded-full opacity-70"
            style={{ backgroundColor: accentColor }}
          />
          <div
            className="absolute bottom-6 right-40 w-2.5 h-2.5 rounded-full opacity-50"
            style={{ backgroundColor: accentColor }}
          />
        </>
      ) : null}

      {/* Content */}
      <div className="relative z-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2.5">
              <motion.div
                animate={disableHeavy ? undefined : { rotate: [0, 360] }}
                transition={disableHeavy ? undefined : { duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="h-5 w-5" style={{ color: accentColor }} />
              </motion.div>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: accentColor }}>
                {t('sidebar.users')}
              </span>
            </div>

            <motion.h1
              className="mb-1 text-2xl font-bold sm:text-3xl"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={interfaceTransition}
              style={{ color: inverseTextColor }}
            >
              {t('users.title')}
            </motion.h1>

            <motion.p
              className="max-w-lg text-sm leading-6 sm:text-base"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={interfaceTransition}
              style={{ color: inverseSubtextColor }}
            >
              {t('users.subtitle')}
            </motion.p>
          </div>

          <div id="tour-users-actions" className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
            {[
              { id: 'tour-users-refresh-button', icon: RefreshCw, label: labels.refresh, onClick: onRefresh ?? (() => {}), index: 0, spin: isRefreshing },
              { id: 'tour-users-export-button', icon: Download, label: labels.exportCsv, onClick: onExportUsers, index: 1 },
              { id: 'tour-users-import-button', icon: Upload, label: labels.import, onClick: onImportClick, index: 2 },
              { id: 'tour-users-invite-button', icon: Mail, label: labels.invite, onClick: onInviteClick, index: 3 },
            ].map(({ id, icon: Icon, label, onClick, index, spin }) => (
              <motion.button
                id={id}
                key={label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  ...interfaceTransition,
                  delay: disableHeavy ? 0 : Math.min(index * interfaceStaggerSeconds, 0.08),
                }}
                onClick={onClick}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition-colors sm:text-sm"
                style={{
                  borderColor: inverseBorderColor,
                  backgroundColor: inverseSurface,
                  color: inverseTextColor,
                }}
                whileHover={disableHeavy ? undefined : { scale: 1.01, backgroundColor: inverseSurface }}
                whileTap={disableHeavy ? undefined : { scale: 0.99 }}
              >
                <Icon className={`h-4 w-4${spin ? ' animate-spin' : ''}`} />
                {label}
              </motion.button>
            ))}

            <motion.button
              id="tour-users-add-button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                ...interfaceTransition,
                delay: disableHeavy ? 0 : Math.min(4 * interfaceStaggerSeconds, 0.08),
              }}
              onClick={onAddClick}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all sm:text-sm"
              style={{
                backgroundColor: primaryColor,
                color: onPrimaryColor,
                boxShadow: `0 8px 30px color-mix(in srgb, ${primaryColor} 25.1%, transparent)`,
              }}
              whileHover={disableHeavy ? undefined : { scale: 1.02 }}
              whileTap={disableHeavy ? undefined : { scale: 0.98 }}
            >
              <Plus className="h-4 w-4" style={{ color: onPrimaryColor }} strokeWidth={3} />
              <span>{labels.add}</span>
            </motion.button>
          </div>
      </div>
    </div>
  </motion.div>
  )
}

function translateLabel(t: TFunction, key: string, fallbackKey: string) {
  const value = t(key)
  if (typeof value === 'string' && value !== key) return value

  const fallback = t(fallbackKey)
  if (typeof fallback === 'string' && fallback !== fallbackKey) return fallback

  return key
}
