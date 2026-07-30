import type { Transition } from 'framer-motion'

import { DashboardStatsGrid } from './DashboardStatsGrid'
import { DashboardStatsHeader } from './DashboardStatsHeader'
import type { BusinessUserDashboardShellProps } from './types'
import styles from '../BusinessUserDashboard.module.css'

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
  return (
    <section className={styles.statsSection}>
      <DashboardStatsHeader
        disableHeavyEffects={props.disableHeavyEffects}
        interfaceTransition={props.interfaceTransition}
        orgColors={props.orgColors}
        t={props.t}
      />
      <DashboardStatsGrid {...props} />
    </section>
  )
}
