'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { AdminCompaniesHeaderActions } from './AdminCompaniesHeaderActions'
import { AdminCompaniesHeaderBadge } from './AdminCompaniesHeaderBadge'

interface AdminCompaniesHeaderProps {
  onRefresh: () => void
  onCreate: () => void
}

export function AdminCompaniesHeader({ onRefresh, onCreate }: AdminCompaniesHeaderProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="group relative mb-6 overflow-hidden rounded-3xl p-8"
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
              {t('companies.page.eyebrow')}
            </span>
          </div>

          <h1 className="mb-2 text-3xl font-bold lg:text-4xl" style={{ color: theme.inverseTextColor }}>
            {t('companies.page.title')}
          </h1>
          <p className="max-w-2xl text-lg" style={{ color: theme.inverseSubtextColor }}>
            {t('companies.page.subtitle')}
          </p>
        </div>

        <AdminCompaniesHeaderActions onRefresh={onRefresh} onCreate={onCreate} />
      </div>
      <AdminCompaniesHeaderBadge />
    </motion.header>
  )
}
