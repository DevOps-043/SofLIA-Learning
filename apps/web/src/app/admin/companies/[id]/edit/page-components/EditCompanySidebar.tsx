'use client'

import { motion } from 'framer-motion'
import { NAV_ITEMS } from '../sections/shared'

interface EditCompanySidebarProps {
  activeTab: string
  interfaceTransition: unknown
  onTabChange: (tabId: string) => void
}

export function EditCompanySidebar({
  activeTab,
  interfaceTransition,
  onTabChange,
}: EditCompanySidebarProps) {
  return (
    <div className="hidden w-80 shrink-0 space-y-2 border-r border-gray-100 bg-white p-6 dark:border-white/5 dark:bg-[#0A0D12] lg:block">
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`group relative flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all ${isActive ? 'bg-[#0A2540]/5 dark:bg-[#00D4B3]/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
          >
            {isActive ? (
              <motion.div
                layoutId="activeTab"
                className="absolute left-0 h-8 w-1.5 rounded-r-full bg-[#0A2540] dark:bg-[#00D4B3]"
                transition={interfaceTransition as never}
              />
            ) : null}
            <item.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-[#0A2540] dark:text-[#00D4B3]' : 'text-gray-400 group-hover:text-gray-900 dark:text-[#8899A6] dark:group-hover:text-white'}`} />
            <span className={`text-sm font-semibold transition-colors ${isActive ? 'text-[#0A2540] dark:text-[#00D4B3]' : 'text-gray-500 group-hover:text-gray-900 dark:text-[#8899A6] dark:group-hover:text-white'}`}>
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
