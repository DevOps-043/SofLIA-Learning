import type { BusinessUserDashboardColors } from '../../types'
import styles from '../BusinessUserDashboard.module.css'

interface HeroBackgroundProps {
  disableHeavyEffects: boolean
  orgColors: BusinessUserDashboardColors
}

export function HeroBackground({ disableHeavyEffects }: HeroBackgroundProps) {
  return (
    <div
      className={styles.heroBackground}
      data-motion={disableHeavyEffects ? 'reduced' : 'full'}
      aria-hidden="true"
    />
  )
}
