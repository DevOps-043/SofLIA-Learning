'use client'

import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useMinuteTicker } from '@/hooks/useMinuteTicker'
import { useMotionSafe } from '@/lib/utils/motion'
import { useTour } from '@/features/tours'
import { businessPanelDashboardTour } from '@/features/tours/config/business-panel-dashboard.tour'

import { ActivityItem } from './dashboard/ActivityItem'
import { StatCard } from './dashboard/StatCard'
import { useBusinessPanelDashboardLogic } from '../hooks/useBusinessPanelDashboardLogic'
import styles from './BusinessPanelDashboard.module.css'

type DashboardVariables = CSSProperties & Record<`--dashboard-${string}`, string>

export function BusinessPanelDashboard() {
  const { t } = useTranslation('business')
  const [isStatsOpenMobile, setIsStatsOpenMobile] = useState(false)
  const { interfaceTransition } = useMotionSafe()

  const {
    activities,
    activitiesLoading,
    formatDate,
    getGreeting,
    getUserName,
    isLoading,
    statsData,
    themeColors,
  } = useBusinessPanelDashboardLogic()

  const { autoStartIfNeeded } = useTour(businessPanelDashboardTour)

  useEffect(() => autoStartIfNeeded(), [autoStartIfNeeded])

  const dashboardVariables: DashboardVariables = {
    '--dashboard-accent': themeColors.accent,
    '--dashboard-action': themeColors.actionColor,
    '--dashboard-border': themeColors.borderColor,
    '--dashboard-card': themeColors.cardBg,
    '--dashboard-input': themeColors.inputBg,
    '--dashboard-muted': themeColors.mutedText,
    '--dashboard-on-action': themeColors.onActionColor,
    '--dashboard-primary': themeColors.primary,
    '--dashboard-subtext': themeColors.subtext,
    '--dashboard-text': themeColors.text,
  }

  return (
    <div
      data-tour-id="business-panel-dashboard--page"
      className={styles.dashboard}
      style={dashboardVariables}
    >
      <motion.section
        id="tour-hero-section"
        data-tour-id="business-panel-dashboard--hero"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={interfaceTransition}
        className={styles.hero}
        style={{
          background: themeColors.heroBackground,
          borderColor: themeColors.heroBorderColor,
        }}
      >
        <div className={styles.heroAtmosphere} aria-hidden="true" />
        <div className={styles.heroRingLarge} aria-hidden="true" />
        <div className={styles.heroRingSmall} aria-hidden="true" />
        <div className={styles.heroDot} aria-hidden="true" />

        <div className={styles.heroCopy}>
          <p
            className={styles.eyebrow}
            style={{ color: themeColors.inverseSubtext }}
          >
            <span aria-hidden="true" />
            {t('dashboard.adminEyebrow', { defaultValue: 'Control organizacional' })}
          </p>
          <h1
            data-tour-id="business-panel-dashboard--hero-summary"
            className={styles.heroTitle}
            style={{ color: themeColors.inverseText }}
          >
            <DashboardGreeting getGreeting={getGreeting} userName={getUserName()} />
          </h1>
          <div className={styles.heroMeta}>
            <p style={{ color: themeColors.inverseSubtext }}>
              {t('dashboard.subtitle')}
            </p>
            <span className={styles.heroDate}>
              <CalendarDays aria-hidden="true" />
              <DashboardDateText formatDate={formatDate} />
            </span>
          </div>
        </div>
      </motion.section>

      <section
        id="tour-stats-section"
        data-tour-id="business-panel-dashboard--stats-section"
        className={styles.section}
      >
        <motion.div
          data-tour-id="business-panel-dashboard--stats-header"
          className={styles.sectionHeader}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={interfaceTransition}
        >
          <div>
            <h2>{t('dashboard.generalStats')}</h2>
            <p>{t('dashboard.keyMetrics')}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsStatsOpenMobile((open) => !open)}
            className={styles.mobileSectionToggle}
            aria-label={t('dashboard.toggleStats', {
              defaultValue: isStatsOpenMobile ? 'Ocultar métricas' : 'Mostrar métricas',
            })}
            aria-expanded={isStatsOpenMobile}
          >
            {isStatsOpenMobile ? <ChevronUp /> : <ChevronDown />}
          </button>
        </motion.div>

        <div
          data-tour-id="business-panel-dashboard--stats-grid"
          className={`${styles.statsRegion} ${isStatsOpenMobile ? styles.statsRegionOpen : ''}`}
        >
          {isLoading ? (
            <div className={styles.statsGrid} aria-label="Cargando métricas">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className={styles.statSkeleton} />
              ))}
            </div>
          ) : (
            <div className={styles.statsGrid}>
              {statsData.map((stat, index) => (
                <StatCard
                  key={stat.title}
                  title={stat.title}
                  value={stat.value}
                  delay={index}
                  href={stat.href}
                  id={stat.id}
                  theme={themeColors}
                  icon={stat.icon}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section
        id="tour-activity-section"
        data-tour-id="business-panel-dashboard--recent-activity"
        className={styles.section}
      >
        <motion.div
          data-tour-id="business-panel-dashboard--recent-activity-header"
          className={styles.sectionHeader}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={interfaceTransition}
        >
          <div>
            <h2 id="tour-activity-title">{t('dashboard.recentActivity.title')}</h2>
            <p>{t('dashboard.recentActivity.subtitle')}</p>
          </div>
        </motion.div>

        <motion.div
          id="tour-activity-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={interfaceTransition}
          className={styles.activityCard}
        >
          {activitiesLoading ? (
            <div className={styles.activityLoading} aria-label="Cargando actividad">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className={styles.activitySkeleton}>
                  <span />
                  <div>
                    <i />
                    <i />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className={styles.emptyActivity}>
              <div className={styles.emptyIcon}>
                <CalendarDays aria-hidden="true" />
              </div>
              <h3>{t('dashboard.recentActivity.empty')}</h3>
              <p>
                {t('dashboard.recentActivity.emptyDescription', {
                  defaultValue: 'Las nuevas acciones del equipo aparecerán aquí.',
                })}
              </p>
            </div>
          ) : (
            <div className={styles.activityList}>
              {activities.map((activity, index) => (
                <ActivityItem
                  key={`${activity.title}-${activity.timestamp}-${index}`}
                  title={activity.title || t('dashboard.recentActivity.defaultTitle', { defaultValue: 'Actividad' })}
                  description={activity.description || t('dashboard.recentActivity.defaultDesc', { defaultValue: 'Sin descripción' })}
                  user={activity.user || t('dashboard.recentActivity.defaultUser', { defaultValue: 'Usuario' })}
                  timestamp={activity.timestamp || t('dashboard.recentActivity.defaultTime', { defaultValue: 'Hace un momento' })}
                  type={activity.type || 'system'}
                  delay={index}
                />
              ))}
            </div>
          )}
        </motion.div>
      </section>
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
  return <>{getGreeting(currentTime)}, {userName}.</>
}

function DashboardDateText({
  formatDate,
}: {
  formatDate: (date: Date) => string
}) {
  const currentTime = useMinuteTicker()
  return <>{formatDate(currentTime)}</>
}
