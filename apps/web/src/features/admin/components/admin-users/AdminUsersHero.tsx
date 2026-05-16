'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import type { TFunction } from 'i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { AdminUsersHeroActions } from './AdminUsersHeroActions'
import { AdminUsersHeroBadge } from './AdminUsersHeroBadge'

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

        <AdminUsersHeroActions
          isRefreshing={isRefreshing}
          onAddClick={onAddClick}
          onRefresh={onRefresh}
          t={t}
        />
      </div>
      <AdminUsersHeroBadge />
    </motion.div>
  )
}
