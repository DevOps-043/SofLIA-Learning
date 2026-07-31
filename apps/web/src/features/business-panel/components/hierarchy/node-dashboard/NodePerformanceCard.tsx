'use client'

import { TrendingUp } from 'lucide-react'
import type { NodeDashboardCommonProps } from './node-dashboard.types'
import styles from '../HierarchyExperience.module.css'

export function NodePerformanceCard({ state, t }: NodeDashboardCommonProps) {
  const node = state.data?.node
  return (
    <article className={styles.dashboardCard}>
      <div className={styles.dashboardCardBody}>
        <header className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>{t('hierarchy.dashboard.performance.title')}</h2>
            <p className={styles.cardDescription}>{t('hierarchy.dashboard.performance.subtitle', { type: node?.type })}</p>
          </div>
          <div className={styles.sectionIcon}><TrendingUp aria-hidden="true" /></div>
        </header>
        <div className={styles.performanceMetrics}>
          {buildPerformanceStats(state, t).map(item => (
            <div key={item.label} className={styles.performanceMetric}>
              <p>{item.label}</p>
              <span className={styles.performanceValue}>{item.value}</span>
            </div>
          ))}
        </div>
        <div className={styles.chartPlaceholder}>{t('hierarchy.dashboard.performance.chartComingSoon')}</div>
      </div>
    </article>
  )
}

function buildPerformanceStats(state: NodeDashboardCommonProps['state'], t: NodeDashboardCommonProps['t']) {
  return [
    { label: t('hierarchy.dashboard.performance.avgProgress'), value: `${state.analytics?.avg_completion || 0}%` },
    { label: t('hierarchy.dashboard.performance.completedCourses'), value: state.analytics?.courses_completed || 0 },
    { label: t('hierarchy.dashboard.performance.learningHours'), value: `${state.analytics?.total_hours || 0}h` },
  ]
}
