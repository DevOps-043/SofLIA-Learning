import { useState } from 'react'
import type { Transition } from 'framer-motion'

import { BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS } from '@/core/constants/tourTargets'

import { DashboardStatsGrid } from './DashboardStatsGrid'
import { DashboardStatsHeader } from './DashboardStatsHeader'
import type { BusinessUserDashboardShellProps } from './types'

type DashboardStatsSectionProps = Pick<
  BusinessUserDashboardShellProps,
  | 'disableHeavyEffects'
  | 'handleAnalyticsClick'
  | 'handleCertificatesClick'
  | 'myStats'
  | 'orgColors'
  | 'stats'
  | 't'
  | 'userDashboardStyles'
> & {
  interfaceTransition: Transition
}

export function DashboardStatsSection(props: DashboardStatsSectionProps) {
  const [isOpenMobile, setIsOpenMobile] = useState(false)

  return (
    <div
      id={BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.statsSection}
      className="relative hidden scroll-mt-32"
    >
      <section className="mb-6 md:mb-10">
        <DashboardStatsHeader
          disableHeavyEffects={props.disableHeavyEffects}
          interfaceTransition={props.interfaceTransition}
          isOpen={isOpenMobile}
          onToggle={() => setIsOpenMobile((current) => !current)}
          orgColors={props.orgColors}
          t={props.t}
        />
        <div className={!isOpenMobile ? 'hidden md:block' : 'block'}>
          <DashboardStatsGrid {...props} />
        </div>
      </section>
    </div>
  )
}
