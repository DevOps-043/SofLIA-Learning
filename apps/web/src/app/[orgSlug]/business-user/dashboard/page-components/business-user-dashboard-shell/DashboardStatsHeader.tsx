import { motion, type Transition } from 'framer-motion'

import type { BusinessUserDashboardShellProps } from './types'
import styles from '../BusinessUserDashboard.module.css'

interface DashboardStatsHeaderProps {
  disableHeavyEffects: boolean
  interfaceTransition: Transition
  orgColors: BusinessUserDashboardShellProps['orgColors']
  t: BusinessUserDashboardShellProps['t']
}

export function DashboardStatsHeader({
  disableHeavyEffects,
  interfaceTransition,
  t,
}: DashboardStatsHeaderProps) {
  return (
    <motion.div
      initial={disableHeavyEffects ? false : { opacity: 0, y: 10 }}
      animate={disableHeavyEffects ? undefined : { opacity: 1, y: 0 }}
      transition={disableHeavyEffects ? undefined : interfaceTransition}
      className={styles.statsHeader}
    >
      <div>
        <span className={styles.sectionKicker}>
          {t('dashboard.progressPulse', 'Pulso de aprendizaje')}
        </span>
        <h2 className={styles.statsTitle}>
          {t('dashboard.generalStats', 'Tu progreso, en perspectiva')}
        </h2>
      </div>
    </motion.div>
  )
}
