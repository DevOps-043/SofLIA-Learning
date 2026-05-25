import { Suspense } from 'react'

import { BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS } from '@/core/constants/tourTargets'

import { ModernStatsCard } from './dynamic-components'
import type { BusinessUserDashboardShellProps } from './types'

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

function getStatTourId(index: number, isAnalytics: boolean) {
  if (index === 0) return BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.statCourses
  if (index === 3) return BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.statCertificates
  if (isAnalytics) return BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.statAnalytics
  return undefined
}

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
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-5 lg:gap-6">
      <Suspense
        fallback={myStats.map((stat) => (
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
        {myStats.map((stat, index) => {
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
              id={getStatTourId(index, isAnalytics)}
            />
          )
        })}
      </Suspense>
    </div>
  )
}
