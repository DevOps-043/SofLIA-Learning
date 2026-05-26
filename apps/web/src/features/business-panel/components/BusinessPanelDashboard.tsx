'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  SparklesIcon,
  ClockIcon,
  RocketLaunchIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelDashboardLogic } from '../hooks/useBusinessPanelDashboardLogic'
import { useTour } from '@/features/tours'
import { businessPanelDashboardTour } from '@/features/tours/config/business-panel-dashboard.tour'
import { StatCard } from './dashboard/StatCard'
import { QuickAction } from './dashboard/QuickAction'
import { ActivityItem } from './dashboard/ActivityItem'
import { useMinuteTicker } from '@/hooks/useMinuteTicker'
import { useMotionSafe } from '@/lib/utils/motion'

function renderMetricValue(metric: unknown): string | number {
  if (metric && typeof metric === 'object' && 'value' in metric) {
    const value = (metric as { value?: unknown }).value
    return typeof value === 'string' || typeof value === 'number' ? value : 0
  }

  return typeof metric === 'string' || typeof metric === 'number' ? metric : 0
}

export function BusinessPanelDashboard() {
  const { t } = useTranslation('business')
  const [isStatsOpenMobile, setIsStatsOpenMobile] = useState(false)
  const { interfaceTransition } = useMotionSafe()

  const {
    stats,
    activities,
    isLoading,
    activitiesLoading,
    themeColors,
    statsData,
    quickActions,
    getGreeting,
    getUserName,
    formatDate,
    getBackgroundStyles,
  } = useBusinessPanelDashboardLogic()

  const { autoStartIfNeeded } = useTour(businessPanelDashboardTour)

  useEffect(() => {
    return autoStartIfNeeded()
  }, [autoStartIfNeeded])

  return (
    <div
      data-tour-id="business-panel-dashboard--page"
      className="p-3 md:p-6 lg:p-8 min-h-screen"
      style={getBackgroundStyles()}
    >
      {/* Hero Section */}
      <motion.div
        id="tour-hero-section"
        data-tour-id="business-panel-dashboard--hero"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={interfaceTransition}
        className="relative overflow-hidden rounded-2xl md:rounded-3xl p-4 md:p-8 mb-4 md:mb-8 group"
      >
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 mix-blend-multiply opacity-80 z-10" style={{ backgroundColor: themeColors.primary }} />
          <div className="absolute inset-0 z-10" style={{ background: `linear-gradient(to right, ${themeColors.primary}, color-mix(in srgb, ${themeColors.primary} 60%, transparent), transparent)` }} />
          <Image
            src="/images/dashboard-header.webp"
            alt="Business Dashboard Background"
            fill
            priority
            className="object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, 100vw"
          />
        </div>

        <div className="relative z-10">
          <div className="mb-1 flex min-w-0 items-center gap-2 md:mb-2 md:gap-3">
            <SparklesIcon className="h-4 w-4 md:h-6 md:w-6" style={{ color: themeColors.accent }} />
            <span className="truncate text-[10px] font-medium uppercase tracking-wide md:text-sm" style={{ color: 'var(--color-bg-light)' }}>
              {t('dashboard.title')}
            </span>
          </div>

          <motion.h1 className="text-xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2 leading-tight" style={{ color: 'var(--color-bg-light)' }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={interfaceTransition}>
            <DashboardGreeting getGreeting={getGreeting} userName={getUserName()} />
          </motion.h1>

          <motion.p className="text-xs md:text-base lg:text-lg max-w-xl line-clamp-2 md:line-clamp-none" style={{ color: 'var(--color-bg-light)', opacity: 0.7 }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={interfaceTransition}>
            {t('dashboard.subtitle')}
          </motion.p>

          <motion.div className="flex items-center gap-2 md:gap-6 mt-3 md:mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={interfaceTransition}>
            <div className="flex items-center gap-1.5 md:gap-2 text-white/60 text-[10px] md:text-sm">
              <ClockIcon className="h-3 w-3 md:h-4 md:w-4" />
              <span style={{ color: 'var(--color-bg-light)' }} className="opacity-90">
                <DashboardDateText formatDate={formatDate} />
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-8">
          {/* Stats Grid */}
          <section id="tour-stats-section" data-tour-id="business-panel-dashboard--stats-section">
            <motion.div data-tour-id="business-panel-dashboard--stats-header" className="flex items-center justify-between mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={interfaceTransition}>
              <div>
                <h2 className="text-xl font-bold" style={{ color: themeColors.text }}>{t('dashboard.generalStats')}</h2>
                <p className="text-sm mt-1" style={{ color: themeColors.text, opacity: 0.7 }}>{t('dashboard.keyMetrics')}</p>
              </div>
              <button 
                onClick={() => setIsStatsOpenMobile(!isStatsOpenMobile)}
                className="md:hidden flex items-center justify-center p-2 rounded-full transition-colors"
                style={{ backgroundColor: `color-mix(in srgb, ${themeColors.primary} 8.2%, transparent)`, color: themeColors.primary }}
                aria-label="Toggle statistics"
              >
                {isStatsOpenMobile ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
              </button>
            </motion.div>

            <div
              data-tour-id="business-panel-dashboard--stats-grid"
              className={!isStatsOpenMobile ? 'hidden md:block' : 'block'}
            >
              {isLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-[90px] md:h-36 rounded-2xl animate-pulse" style={{ backgroundColor: themeColors.cardBg }} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {statsData.map((stat, index) => (
                    <StatCard
                      key={stat.title}
                      title={stat.title}
                      value={stat.value}
                      change={stat.change}
                      iconColor={stat.iconColor}
                      backgroundImage={stat.backgroundImage}
                      gradient={stat.gradient}
                      gradientStyle={stat.gradientStyle}
                      delay={index}
                      href={stat.href}
                      theme={themeColors}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Activity Section */}
          <section id="tour-activity-section" data-tour-id="business-panel-dashboard--recent-activity">
            <motion.div data-tour-id="business-panel-dashboard--recent-activity-header" className="flex items-center justify-between mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={interfaceTransition}>
              <div>
                <h2 id="tour-activity-title" className="text-xl font-bold" style={{ color: themeColors.text }}>{t('dashboard.recentActivity.title')}</h2>
                <p className="text-sm mt-1" style={{ color: themeColors.text, opacity: 0.7 }}>{t('dashboard.recentActivity.subtitle')}</p>
              </div>
            </motion.div>

            <motion.div id="tour-activity-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={interfaceTransition} className="rounded-2xl border overflow-hidden" style={{ backgroundColor: themeColors.cardBg, borderColor: `color-mix(in srgb, ${themeColors.borderColor} 20%, transparent)` }}>
              {activitiesLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="w-2 h-2 mt-2 rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${themeColors.borderColor} 30.2%, transparent)` }} />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 rounded w-3/4" style={{ backgroundColor: `color-mix(in srgb, ${themeColors.borderColor} 20%, transparent)` }} />
                        <div className="h-3 rounded w-1/2" style={{ backgroundColor: `color-mix(in srgb, ${themeColors.borderColor} 20%, transparent)` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="p-12 text-center">
                  <ClockIcon className="h-12 w-12 mx-auto mb-4" style={{ color: themeColors.text, opacity: 0.3 }} />
                  <p style={{ color: themeColors.text, opacity: 0.6 }}>{t('dashboard.recentActivity.empty')}</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {activities.map((activity, index) => (
                    <div key={index} style={{ borderBottom: index < activities.length - 1 ? `1px solid color-mix(in srgb, ${themeColors.borderColor} 10.2%, transparent)` : 'none' }}>
                      <ActivityItem
                        title={activity.title || t('dashboard.recentActivity.defaultTitle', { defaultValue: 'Actividad' })}
                        description={activity.description || t('dashboard.recentActivity.defaultDesc', { defaultValue: 'Sin descripción' })}
                        user={activity.user || t('dashboard.recentActivity.defaultUser', { defaultValue: 'Usuario' })}
                        timestamp={activity.timestamp || t('dashboard.recentActivity.defaultTime', { defaultValue: 'Hace un momento' })}
                        type={activity.type || 'system'}
                        delay={index}
                      />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </section>
        </div>

        {/* Sidebar - Quick Actions */}
        <div id="tour-quick-actions" data-tour-id="business-panel-dashboard--quick-actions" className="xl:col-span-1">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={interfaceTransition} className="sticky top-24">
            <div id="tour-quick-actions-list">
              <div data-tour-id="business-panel-dashboard--quick-actions-header" className="mb-6">
                <h2 className="text-lg font-bold" style={{ color: themeColors.text }}>{t('dashboard.quickActions.title')}</h2>
                <p className="text-sm mt-1" style={{ color: themeColors.text, opacity: 0.7 }}>{t('dashboard.quickActions.subtitle')}</p>
              </div>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <QuickAction
                    key={action.title}
                    title={action.title}
                    description={action.description}
                    icon={action.icon}
                    href={action.href}
                    color={action.color}
                    delay={index}
                  />
                ))}
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  )
}

function DashboardGreeting({
  getGreeting,
  userName,
}: {
  getGreeting: (date?: Date) => string
  userName: string
}) {
  const currentTime = useMinuteTicker()

  return (
    <>
      {getGreeting(currentTime)}, {userName}
    </>
  )
}

function DashboardDateText({
  formatDate,
}: {
  formatDate: (date: Date) => string
}) {
  const currentTime = useMinuteTicker()

  return <>{formatDate(currentTime)}</>
}
