import type { ComponentType, CSSProperties } from 'react'
import styles from '../HierarchyExperience.module.css'

export type StatColor = 'blue' | 'purple' | 'cyan' | 'emerald' | 'amber' | 'neutral'

const STAT_COLORS: Record<StatColor, string> = {
  blue: 'var(--hierarchy-info)',
  purple: 'var(--color-secondary)',
  cyan: 'var(--hierarchy-accent)',
  emerald: 'var(--hierarchy-success)',
  amber: 'var(--hierarchy-warning)',
  neutral: 'var(--hierarchy-muted)',
}

export function StatCard({
  icon: Icon,
  label,
  value,
  color = 'neutral',
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: number
  color?: StatColor
}) {
  const metricVariables = { '--metric-color': STAT_COLORS[color] } as CSSProperties

  return (
    <div className={styles.metric} style={metricVariables}>
      <div className={styles.metricIcon}>
        <Icon />
      </div>
      <div>
        <p className={styles.metricLabel}>{label}</p>
        <span className={styles.metricValue}>{value}</span>
      </div>
    </div>
  )
}
