'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { ADD_WORKSHOP_TABS } from './service'
import type { AddWorkshopTab } from './types'

interface AddWorkshopModalTabsProps {
  activeTab: AddWorkshopTab
  onChange: (tab: AddWorkshopTab) => void
}

export function AddWorkshopModalTabs({ activeTab, onChange }: AddWorkshopModalTabsProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  return (
    <div className="flex items-center gap-1 border-b px-6 py-3" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
      {ADD_WORKSHOP_TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <motion.button key={tab.id} onClick={() => onChange(tab.id)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200" style={{ backgroundColor: isActive ? theme.actionSurface : 'transparent', color: isActive ? theme.primaryColor : theme.subtextColor }} type="button">
            <Icon className="h-4 w-4" />
            <span>{t(tab.labelKey)}</span>
            {isActive ? <motion.div layoutId="add-workshop-active-tab" className="absolute inset-0 -z-10 rounded-xl" style={{ backgroundColor: theme.actionSurface }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} /> : null}
          </motion.button>
        )
      })}
    </div>
  )
}
