'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  BookOpen,
  Clock,
  GanttChart,
  X,
  User,
  Mail,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react'
import Image from 'next/image'
import type { BusinessUser } from '../services/businessUsers.service'
import { useBusinessUserStatsModalLogic } from '../hooks/useBusinessUserStatsModalLogic'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { BusinessUserAnalyticsPageClient } from './business-user-analytics/BusinessUserAnalyticsPageClient'
import {
  BusinessUserStatsActivityTab,
  BusinessUserStatsCoursesTab,
  BusinessUserStatsLessonsTab,
  BusinessUserStatsOverviewTab,
  type BusinessUserStatsHeaderTab,
  type BusinessUserStatsTheme,
} from './business-user-stats-modal'

interface BusinessUserStatsModalProps {
  user: BusinessUser | null
  isOpen: boolean
  onClose: () => void
  orgSlug?: string
}

export function BusinessUserStatsModal({
  user,
  isOpen,
  onClose,
  orgSlug,
}: BusinessUserStatsModalProps) {
  const panelTheme = useBusinessPanelTheme()
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
    displayName,
  } = useBusinessUserStatsModalLogic({ user, isOpen, onClose, orgSlug })

  if (!isOpen || !user) return null

  // Force strict theme standards
  const theme: BusinessUserStatsTheme = {
    isDark: panelTheme.isDark,
    modalBg: panelTheme.panelBg,
    modalBorder: panelTheme.borderColor,
    cardBg: panelTheme.cardBg,
    textColor: panelTheme.textColor,
    mutedTextColor: panelTheme.mutedTextColor,
    primaryColor: primaryColor || panelTheme.primaryColor,
    accentColor: accentColor || panelTheme.accentColor,
    secondaryColor: secondaryColor || panelTheme.secondaryColor,
    onPrimaryColor: panelTheme.onPrimaryColor,
    chartColors: panelTheme.chartColors,
    successColor: panelTheme.successColor,
    warningColor: panelTheme.warningColor,
    dangerColor: panelTheme.dangerColor,
  }

  const mutedText = theme.mutedTextColor
  const inputBg = panelTheme.inputBg

  // Simplified Tabs
  const tabs: BusinessUserStatsHeaderTab[] = [
    { id: 'analytics', label: t('users.modals.stats.tabs.analytics', 'Analítica'), icon: BarChart3 },
    { id: 'overview', label: t('users.modals.stats.tabs.overview', 'Resumen'), icon: BarChart3 },
    { id: 'courses', label: t('users.modals.stats.tabs.courses', 'Cursos'), icon: BookOpen },
    { id: 'lessons', label: t('users.modals.stats.tabs.lessons', 'Lecciones'), icon: GanttChart },
    { id: 'activity', label: t('users.modals.stats.tabs.activity', 'Actividad'), icon: Clock },
  ]

  const safeActiveTab = tabs.some((tab) => tab.id === activeTab) ? activeTab : 'overview'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 isolate flex h-app-dynamic items-center justify-center overflow-hidden p-0 sm:p-4" style={{ zIndex: 99999 }}>
        {/* Backdrop - COMPLETELY TRANSPARENT */}
        <motion.div
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-transparent"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal Container - STREECT HEIGHT FOR 13" Laptops */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.95, y: 20 }}
           transition={{ type: 'spring', damping: 25, stiffness: 300 }}
           className="relative flex h-full w-full max-w-[1500px] flex-col overflow-hidden bg-transparent shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] sm:h-[min(calc(var(--soflia-viewport-height)-2rem),900px)] sm:max-h-[900px] sm:rounded-[2.5rem]"
           onClick={(event) => event.stopPropagation()}
        >
          <div
            className="flex flex-col h-full bg-transparent overflow-hidden border"
            style={{
              backgroundColor: theme.modalBg,
              borderColor: theme.modalBorder,
            }}
          >
            {/* 1. Header Section - Top-Down architecture */}
            <div className="relative shrink-0 pt-6 sm:pt-8 pb-4 sm:pb-6 px-6 lg:px-12 border-b border-white/5">
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                   {/* Avatar Circle */}
                   <div className="relative shrink-0">
                     <div
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center shadow-2xl border-2 sm:border-4"
                        style={{
                           background: user.profile_picture_url ? 'transparent' : `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                           borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'var(--color-bg-light)',
                        }}
                     >
                        {user.profile_picture_url ? (
                           <Image src={user.profile_picture_url} alt={displayName} fill className="object-cover rounded-[1.5rem] sm:rounded-[2rem]" />
                        ) : (
                           <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={2.5} />
                        )}
                     </div>
                   </div>

                   <div className="flex-1 text-center sm:text-left min-w-0">
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-1 truncate" style={{ color: theme.textColor }}>
                         {displayName}
                      </h2>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                         <div className="px-3 py-1 rounded-xl border text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2" style={{ backgroundColor: inputBg, borderColor: theme.modalBorder, color: mutedText }}>
                            <Mail className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[150px] sm:max-w-none">{user.email}</span>
                         </div>
                         <div className="px-3 py-1 rounded-xl border text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 capitalize" style={{ backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 8.2%, transparent)`, borderColor: `color-mix(in srgb, ${theme.primaryColor} 12.5%, transparent)`, color: theme.primaryColor }}>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{user.org_role}</span>
                         </div>
                      </div>
                   </div>

                   {/* Tabs / Chips */}
                   <div className="flex items-center gap-2 shrink-0">
                      {tabs.map((tab) => (
                         <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`p-2.5 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${safeActiveTab === tab.id ? 'shadow-xl' : 'opacity-30 grayscale hover:opacity-100 hover:grayscale-0'}`}
                            style={safeActiveTab === tab.id ? {
                               backgroundColor: theme.primaryColor,
                               color: theme.onPrimaryColor,
                            } : {
                               backgroundColor: inputBg,
                               color: theme.textColor,
                            }}
                         >
                            <tab.icon className="w-4 h-4" />
                            <span className="hidden xs:inline">{tab.label}</span>
                         </button>
                      ))}
                   </div>

                   <button 
                      onClick={onClose} 
                      className="p-3 rounded-2xl transition-all border shrink-0"
                      style={{
                         backgroundColor: inputBg,
                         borderColor: theme.modalBorder,
                         color: mutedText,
                      }}
                   >
                      <X className="w-5 h-5" />
                   </button>
                </div>
            </div>

            {/* 2. Content Area */}
            <div className="flex-1 overflow-hidden relative">
               <div
                  className="h-full overflow-y-auto pt-6 pb-24 sm:pb-32 px-6 lg:px-12"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255,255,255,0.05) transparent',
                  }}
               >
                  {safeActiveTab === 'analytics' ? (
                    <div className="mx-auto w-full max-w-[1400px]">
                      <BusinessUserAnalyticsPageClient
                        embedded
                        orgSlug={orgSlug}
                        showBackButton={false}
                        userId={user.id}
                      />
                    </div>
                  ) : loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                      <div
                        className="w-12 h-12 border-[3px] rounded-full animate-spin"
                        style={{
                          borderColor: `color-mix(in srgb, ${theme.primaryColor} 12.5%, transparent)`,
                          borderTopColor: theme.primaryColor,
                        }}
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('common.loading', 'Cargando datos...')}</span>
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                       <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                          <Info className="w-8 h-8 text-red-500" />
                       </div>
                       <p className="text-red-400 font-black uppercase text-xs">{error}</p>
                    </div>
                  ) : stats ? (
                    <div className="max-w-5xl mx-auto">
                      {safeActiveTab === 'overview' ? (
                        <BusinessUserStatsOverviewTab stats={stats} t={t} theme={theme} />
                      ) : safeActiveTab === 'courses' ? (
                        <BusinessUserStatsCoursesTab
                          stats={stats}
                          t={t}
                          theme={theme}
                          formatDate={formatDate}
                        />
                      ) : safeActiveTab === 'lessons' ? (
                        <BusinessUserStatsLessonsTab stats={stats} t={t} theme={theme} />
                      ) : (
                        <BusinessUserStatsActivityTab
                          stats={stats}
                          t={t}
                          theme={theme}
                          formatDate={formatDate}
                          formatMonth={formatMonth}
                        />
                      )}
                    </div>
                  ) : null}
               </div>

               {/* Footer / Status Bar - ULTA COMPACT */}
               <div 
                  className="absolute bottom-0 left-0 right-0 p-5 px-8 flex items-center justify-between gap-4 border-t"
                  style={{ backgroundColor: theme.modalBg, borderColor: theme.modalBorder }}
               >
                  <div className="hidden sm:flex items-center gap-3 opacity-30 select-none">
                     <BarChart3 className="w-5 h-5" style={{ color: theme.textColor }} />
                     <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textColor }}>Panel de Analítica</span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                     <button
                        onClick={onClose}
                        className="flex-1 sm:flex-none px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border"
                        style={{ color: mutedText, backgroundColor: inputBg, borderColor: theme.modalBorder }}
                     >
                        {t('common.close', 'Cerrar')}
                     </button>
                     <button
                        onClick={onClose}
                        className="flex-[2] sm:flex-none px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3"
                        style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }}
                     >
                        <span className="font-black">{t('common.done', 'Finalizar')}</span>
                        <ChevronRight className="w-4 h-4" strokeWidth={3} />
                     </button>
                  </div>
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
