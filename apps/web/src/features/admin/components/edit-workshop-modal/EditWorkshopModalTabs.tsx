'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { EditWorkshopTab } from './types'
import { EDIT_WORKSHOP_TABS } from './service'

interface EditWorkshopModalTabsProps {
  activeTab: EditWorkshopTab
  onChange: (tab: EditWorkshopTab) => void
}

export function EditWorkshopModalTabs({ activeTab, onChange }: EditWorkshopModalTabsProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  return (
    <div className="flex flex-wrap gap-2 border-b px-6 py-4" style={{ borderColor: theme.borderColor }}>
      {EDIT_WORKSHOP_TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <motion.button key={tab.id} type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onChange(tab.id)} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200" style={{ backgroundColor: isActive ? `${theme.primaryColor}14` : theme.inputBg, color: isActive ? theme.primaryColor : theme.subtextColor }}>
            <Icon className="h-4 w-4" />
            <span>{t(tab.labelKey)}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
