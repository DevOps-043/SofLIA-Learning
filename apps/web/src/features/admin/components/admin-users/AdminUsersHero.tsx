'use client'

import { motion } from 'framer-motion'
import { Plus, RefreshCw, Sparkles, Users } from 'lucide-react'
import type { TFunction } from 'i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

interface AdminUsersHeroProps {
  filteredCount: number
  onAddClick: () => void
  onRefresh: () => void
  isRefreshing: boolean
  t: TFunction<'admin'>
}

export function AdminUsersHero({
  filteredCount,
  isRefreshing,
  onAddClick,
  onRefresh,
  t,
}: AdminUsersHeroProps) {
  const theme = useAdminPanelTheme()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="group relative overflow-hidden rounded-3xl p-8"
      style={{
        background: theme.heroBackground,
        border: `1px solid ${theme.heroBorderColor}`,
      }}
    >
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, ${theme.inverseTextColor} 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="h-6 w-6" style={{ color: theme.accentColor }} />
            </motion.div>
            <span
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: theme.accentColor }}
            >
              {t('navigation.users')}
            </span>
          </div>

          <h1
            className="mb-2 text-3xl font-bold lg:text-4xl"
            style={{ color: theme.inverseTextColor }}
          >
            {t('users.page.title')}
          </h1>
          <p className="max-w-xl text-lg" style={{ color: theme.inverseSubtextColor }}>
            {t(filteredCount === 1 ? 'users.page.subtitle_one' : 'users.page.subtitle', {
              count: filteredCount,
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-start gap-3 lg:justify-end">
          <motion.button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors"
            style={{
              backgroundColor: theme.inverseSurface,
              borderColor: theme.inverseBorderColor,
              color: theme.inverseTextColor,
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <RefreshCw className={`h-4 w-4${isRefreshing ? ' animate-spin' : ''}`} />
            {t('users.page.retry')}
          </motion.button>

          <motion.button
            type="button"
            onClick={onAddClick}
            className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all"
            style={{
              backgroundColor: theme.primaryColor,
              boxShadow: `0 8px 30px ${theme.primaryColor}40`,
              color: theme.onPrimaryColor,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-5 w-5" strokeWidth={3} />
            <span>{t('users.page.addUser')}</span>
          </motion.button>
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-6 right-8 hidden h-20 w-20 items-center justify-center rounded-[2rem] border opacity-20 lg:flex"
        style={{
          backgroundColor: theme.inverseSurface,
          borderColor: theme.inverseBorderColor,
          color: theme.inverseTextColor,
        }}
      >
        <Users className="h-10 w-10" />
      </div>
    </motion.div>
  )
}
