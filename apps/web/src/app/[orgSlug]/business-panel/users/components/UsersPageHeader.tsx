'use client'

import { motion } from 'framer-motion'
import { Download, Mail, Plus, RefreshCw, Sparkles, Upload } from 'lucide-react'
import type { TFunction } from 'i18next'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { useMotionSafe } from '@/lib/utils/motion'

interface UsersPageHeaderProps {
  t: TFunction
  onDownloadTemplate: () => void
  onImportClick: () => void
  onInviteClick: () => void
  onAddClick: () => void
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function UsersPageHeader({ t, onDownloadTemplate, onImportClick, onInviteClick, onAddClick, onRefresh, isRefreshing }: UsersPageHeaderProps) {
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

  return (
    <motion.div
      id="tour-users-hero"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={interfaceTransition}
      className="relative overflow-hidden rounded-3xl p-8 group"
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
            className="absolute bottom-10 right-40 w-3 h-3 rounded-full opacity-50"
            style={{ backgroundColor: accentColor }}
          />
        </>
      ) : null}

      {/* Content */}
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <motion.div
                animate={disableHeavy ? undefined : { rotate: [0, 360] }}
                transition={disableHeavy ? undefined : { duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-6 h-6" style={{ color: accentColor }} />
              </motion.div>
              <span className="text-sm font-semibold tracking-wider uppercase" style={{ color: accentColor }}>
                {t('sidebar.users')}
              </span>
            </div>

            <motion.h1
              className="text-3xl lg:text-4xl font-bold mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={interfaceTransition}
              style={{ color: inverseTextColor }}
            >
              {t('users.title')}
            </motion.h1>

            <motion.p
              className="text-lg max-w-xl"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={interfaceTransition}
              style={{ color: inverseSubtextColor }}
            >
              {t('users.subtitle')}
            </motion.p>
          </div>

          <div id="tour-users-actions" className="flex flex-wrap items-center justify-start gap-3 lg:justify-end">
            {[
              { id: 'tour-users-refresh-button', icon: RefreshCw, label: t('users.buttons.refresh', 'Actualizar'), onClick: onRefresh ?? (() => {}), index: 0, spin: isRefreshing },
              { id: 'tour-users-template-button', icon: Download, label: t('users.buttons.template'), onClick: onDownloadTemplate, index: 1 },
              { id: 'tour-users-import-button', icon: Upload, label: t('users.buttons.import', 'Importar'), onClick: onImportClick, index: 2 },
              { id: 'tour-users-invite-button', icon: Mail, label: t('users.buttons.invite', 'Invitar'), onClick: onInviteClick, index: 3 },
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
                className="px-4 py-2.5 rounded-xl font-bold text-sm border transition-colors flex items-center gap-2"
                style={{
                  borderColor: inverseBorderColor,
                  backgroundColor: inverseSurface,
                  color: inverseTextColor,
                }}
                whileHover={disableHeavy ? undefined : { scale: 1.01, backgroundColor: inverseSurface }}
                whileTap={disableHeavy ? undefined : { scale: 0.99 }}
              >
                <Icon className={`w-4 h-4${spin ? ' animate-spin' : ''}`} />
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
              className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
              style={{
                backgroundColor: primaryColor,
                color: onPrimaryColor,
                boxShadow: `0 8px 30px color-mix(in srgb, ${primaryColor} 25.1%, transparent)`,
              }}
              whileHover={disableHeavy ? undefined : { scale: 1.02 }}
              whileTap={disableHeavy ? undefined : { scale: 0.98 }}
            >
              <Plus className="w-5 h-5" style={{ color: onPrimaryColor }} strokeWidth={3} />
              <span>{t('users.buttons.add')}</span>
            </motion.button>
          </div>
      </div>
    </div>
  </motion.div>
  )
}
