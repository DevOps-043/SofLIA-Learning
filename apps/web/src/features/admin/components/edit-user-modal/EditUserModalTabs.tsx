'use client'

import { motion } from 'framer-motion'
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
  return (
    <div className="flex items-center gap-1 px-6 py-3 bg-[#E9ECEF]/50 dark:bg-[#0A0D12] border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
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
                ? 'text-[#00D4B3] bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20'
                : 'text-[#6C757D] dark:text-white/60 hover:text-[#0A2540] dark:hover:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#1E2329]'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-xl bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
