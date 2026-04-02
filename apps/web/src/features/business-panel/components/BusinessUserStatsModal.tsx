'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, BookOpen, Clock, TrendingUp } from 'lucide-react'
import type { BusinessUser } from '../services/businessUsers.service'
import {
  buildBusinessUserStatsTabs,
} from '../services/business-user-stats-display.service'
import { useBusinessUserStatsModalLogic } from '../hooks/useBusinessUserStatsModalLogic'
import {
  BusinessUserStatsActivityTab,
  BusinessUserStatsCoursesTab,
  BusinessUserStatsHeader,
  BusinessUserStatsOverviewTab,
  BusinessUserStatsProgressTab,
  BusinessUserStatsSidebar,
  type BusinessUserStatsTheme,
} from './business-user-stats-modal'

interface BusinessUserStatsModalProps {
  user: BusinessUser | null
  isOpen: boolean
  onClose: () => void
}

export function BusinessUserStatsModal({
  user,
  isOpen,
  onClose,
}: BusinessUserStatsModalProps) {
  const {
    t,
    isDark,
    stats,
    loading,
    error,
    activeTab,
    setActiveTab,
    modalBg,
    modalBorder,
    textColor,
    primaryColor,
    accentColor,
    secondaryColor,
    formatMonth,
    formatDate,
    formatRelativeTime,
    displayName,
    initials,
  } = useBusinessUserStatsModalLogic({ user, isOpen, onClose })

  if (!isOpen || !user) return null

  const theme: BusinessUserStatsTheme = {
    isDark,
    modalBg,
    modalBorder,
    textColor,
    primaryColor,
    accentColor,
    secondaryColor,
  }

  const tabs = buildBusinessUserStatsTabs({
    overview: 'Resumen',
    courses: 'Cursos',
    progress: 'Progreso',
    activity: 'Actividad',
  }).map((tab) => ({
    ...tab,
    icon:
      tab.id === 'overview'
        ? BarChart3
        : tab.id === 'courses'
          ? BookOpen
          : tab.id === 'progress'
            ? TrendingUp
            : Clock,
  }))

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 99999 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl mx-4 max-h-[90vh] flex"
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className="rounded-2xl shadow-2xl overflow-hidden border w-full flex flex-col"
            style={{ backgroundColor: modalBg, borderColor: modalBorder }}
          >
            <div className="flex min-h-[500px] max-h-[85vh]">
              <BusinessUserStatsSidebar
                user={user}
                displayName={displayName}
                initials={initials}
                t={t}
                theme={theme}
                formatDate={formatDate}
                formatRelativeTime={formatRelativeTime}
              />

              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <BusinessUserStatsHeader
                  activeTab={activeTab}
                  onChangeTab={setActiveTab}
                  onClose={onClose}
                  tabs={tabs}
                  theme={theme}
                />

                <div
                  className="flex-1 overflow-y-auto p-3 lg:p-4"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255,255,255,0.1) transparent',
                  }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div
                        className="w-8 h-8 border-3 rounded-full animate-spin"
                        style={{
                          borderColor: `${primaryColor}30`,
                          borderTopColor: primaryColor,
                        }}
                      />
                    </div>
                  ) : error ? (
                    <div className="text-center py-12 text-red-400">{error}</div>
                  ) : stats ? (
                    <>
                      {activeTab === 'overview' ? (
                        <BusinessUserStatsOverviewTab stats={stats} t={t} theme={theme} />
                      ) : null}
                      {activeTab === 'courses' ? (
                        <BusinessUserStatsCoursesTab
                          stats={stats}
                          t={t}
                          theme={theme}
                          formatDate={formatDate}
                        />
                      ) : null}
                      {activeTab === 'progress' ? (
                        <BusinessUserStatsProgressTab
                          stats={stats}
                          t={t}
                          theme={theme}
                          formatDate={formatDate}
                        />
                      ) : null}
                      {activeTab === 'activity' ? (
                        <BusinessUserStatsActivityTab
                          stats={stats}
                          t={t}
                          theme={theme}
                          formatDate={formatDate}
                          formatMonth={formatMonth}
                        />
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
