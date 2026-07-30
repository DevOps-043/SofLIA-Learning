import type { BusinessUserDashboardColors } from '../../types'
import styles from '../BusinessUserDashboard.module.css'

interface HeroDecorationsProps {
  orgColors: BusinessUserDashboardColors
}

export function HeroDecorations({ orgColors }: HeroDecorationsProps) {
  return (
    <>
      <div
        className={`${styles.heroNode} ${styles.heroNodeOne}`}
        style={{ backgroundColor: orgColors.accent }}
      />
      <div
        className={`${styles.heroNode} ${styles.heroNodeTwo}`}
        style={{ backgroundColor: orgColors.primary }}
      />
    </>
  )
}
