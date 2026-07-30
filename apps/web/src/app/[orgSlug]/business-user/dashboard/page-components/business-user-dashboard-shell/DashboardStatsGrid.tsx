import { Suspense } from 'react'

import { ModernStatsCard } from './dynamic-components'
import type { BusinessUserDashboardShellProps } from './types'
import styles from '../BusinessUserDashboard.module.css'

type DashboardStatsGridProps = Pick<
  BusinessUserDashboardShellProps,
  | 'disableHeavyEffects'
  | 'handleAnalyticsClick'
  | 'handleCertificatesClick'
  | 'myStats'
  | 'orgColors'
  | 'stats'
  | 'userDashboardStyles'
>

export function DashboardStatsGrid({
  disableHeavyEffects,
  handleAnalyticsClick,
  handleCertificatesClick,
  myStats,
  orgColors,
  stats,
  userDashboardStyles,
}: DashboardStatsGridProps) {
  return (
    <div className={styles.statsGrid}>
      <Suspense
        fallback={myStats.filter((stat) => stat.kind !== 'analytics').map((stat) => (
          <div
            key={stat.label}
            className="h-32 animate-pulse rounded-2xl p-5"
            style={{
              backgroundColor: orgColors.cardBg,
              border: `1px solid ${orgColors.border}`,
            }}
          />
        ))}
      >
        {myStats.filter((stat) => stat.kind !== 'analytics').map((stat, index) => {
          const isCertificates = stat.kind === 'certificates'
          const isAnalytics = stat.kind === 'analytics'
          return (
            <ModernStatsCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              index={index}
              onClick={isCertificates && stats.certificates > 0 ? handleCertificatesClick : isAnalytics ? handleAnalyticsClick : undefined}
              isClickable={(isCertificates && stats.certificates > 0) || isAnalytics}
              styles={userDashboardStyles}
              disableHeavyEffects={disableHeavyEffects}
            />
          )
        })}
      </Suspense>
    </div>
  )
}
