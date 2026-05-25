'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ShieldCheckIcon, UserIcon } from '@heroicons/react/24/outline'
import { EDIT_USER_TABS } from './service'
import type { TabType } from './types'

const iconMap = {
  user: UserIcon,
  shield: ShieldCheckIcon,
}

interface EditUserModalTabsProps {
  activeTab: TabType
  onChange: (tab: TabType) => void
}

export function EditUserModalTabs({
  activeTab,
  onChange,
}: EditUserModalTabsProps) {
  const { t } = useTranslation('admin')
  return (
    <div className="flex items-center gap-1 px-6 py-3 bg-gray-200/50 dark:bg-carbon-950 border-b border-gray-200 dark:border-gray-500/30">
      {EDIT_USER_TABS.map((tab) => {
        const Icon = iconMap[tab.iconName]
        const isActive = activeTab === tab.id

        return (
          <motion.button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'text-accent bg-accent/10 dark:bg-accent/20'
                : 'text-gray-500 dark:text-white/60 hover:text-primary dark:hover:text-white hover:bg-gray-200 dark:hover:bg-carbon-800'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{t(`users.editModal.tabs.${tab.id}`)}</span>
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-xl bg-accent/10 dark:bg-accent/20 -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
