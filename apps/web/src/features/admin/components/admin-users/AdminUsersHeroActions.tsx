'use client'

import { motion } from 'framer-motion'
import { Plus, RefreshCw } from 'lucide-react'
import type { TFunction } from 'i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

interface AdminUsersHeroActionsProps {
  isRefreshing: boolean
  onAddClick: () => void
  onRefresh: () => void
  t: TFunction<'admin'>
}

export function AdminUsersHeroActions(props: AdminUsersHeroActionsProps) {
  const { isRefreshing, onAddClick, onRefresh, t } = props
  const theme = useAdminPanelTheme()
  return (
    <div className="flex flex-wrap items-center justify-start gap-3 lg:justify-end">
      <motion.button type="button" onClick={onRefresh} className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors" style={{ backgroundColor: theme.inverseSurface, borderColor: theme.inverseBorderColor, color: theme.inverseTextColor }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <RefreshCw className={`h-4 w-4${isRefreshing ? ' animate-spin' : ''}`} />
        {t('users.page.retry')}
      </motion.button>
      <motion.button type="button" onClick={onAddClick} className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all" style={{ backgroundColor: theme.primaryColor, boxShadow: `0 8px 30px ${theme.primaryColor}40`, color: theme.onPrimaryColor }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Plus className="h-5 w-5" strokeWidth={3} />
        <span>{t('users.page.addUser')}</span>
      </motion.button>
    </div>
  )
}
