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
    <div className="sticky top-0 hidden w-64 shrink-0 self-start lg:block">
      <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm dark:border-white/5 dark:bg-carbon-800">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="group relative flex w-full items-center gap-3 rounded-xl p-3.5 text-left transition-all hover:bg-gray-50 dark:hover:bg-white/5"
              style={isActive ? { backgroundColor: `color-mix(in srgb, ${item.color} 8%, transparent)` } : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 h-7 w-1 rounded-r-full"
                  transition={interfaceTransition as never}
                  style={{ backgroundColor: item.color }}
                />
              )}
              <item.icon
                className={`h-[18px] w-[18px] shrink-0 transition-colors ${!isActive ? 'text-gray-400 group-hover:text-gray-700 dark:text-muted dark:group-hover:text-white' : ''}`}
                style={isActive ? { color: item.color } : undefined}
              />
              <span
                className={`text-sm font-semibold transition-colors ${!isActive ? 'text-gray-500 group-hover:text-gray-900 dark:text-muted dark:group-hover:text-white' : ''}`}
                style={isActive ? { color: item.color } : undefined}
              >
                {item.label}
              </span>
              {!isActive && (
                <span
                  className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full opacity-0 transition-opacity group-hover:opacity-40"
                  style={{ backgroundColor: item.color }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
