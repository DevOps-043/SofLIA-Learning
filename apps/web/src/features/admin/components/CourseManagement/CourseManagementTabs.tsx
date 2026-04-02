'use client'

import { motion } from 'framer-motion'
import { Book, BarChart3, Eye, Settings } from 'lucide-react'

import { COURSE_MANAGEMENT_TABS, isCourseManagementTabDisabled } from './CourseManagement.utils'
import type { ActiveTab } from './types'
import { useCourseManagementContext } from './CourseManagementContext'

const TAB_ICONS: Record<Exclude<ActiveTab, 'certificates'>, typeof Book> = {
  modules: Book,
  config: Settings,
  preview: Eye,
  stats: BarChart3,
}

export function CourseManagementTabs() {
  const {
    state: { activeTab, setActiveTab, isNewCourse },
  } = useCourseManagementContext()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="mb-6 rounded-xl border border-[#E9ECEF] bg-white p-1.5 shadow-sm dark:border-[#6C757D]/30 dark:bg-[#1E2329]"
    >
      <div className="flex gap-1.5">
        {COURSE_MANAGEMENT_TABS.map((tab) => {
          const isDisabled = isCourseManagementTabDisabled(tab.key, isNewCourse)
          const Icon = TAB_ICONS[tab.key]

          return (
            <motion.button
              key={tab.key}
              onClick={() => !isDisabled && setActiveTab(tab.key)}
              disabled={isDisabled}
              whileHover={{ scale: isDisabled ? 1 : 1.02 }}
              whileTap={{ scale: isDisabled ? 1 : 0.98 }}
              className={`relative flex-1 rounded-lg px-4 py-2.5 text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? 'text-white'
                  : isDisabled
                    ? 'cursor-not-allowed text-gray-300 opacity-50 dark:text-gray-700'
                    : 'text-[#6C757D] hover:text-[#0A2540] dark:text-white/60 dark:hover:text-white'
              }`}
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 shadow-md dark:from-[#0A2540] dark:to-[#0A2540]/80"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Icon className={`h-3.5 w-3.5 ${activeTab === tab.key ? 'text-white' : ''}`} />
                <span>{tab.label}</span>
              </span>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
