'use client'

import { NodeManagerCard } from './NodeManagerCard'
import { NodePerformanceCard } from './NodePerformanceCard'
import type { NodeDashboardCommonProps } from './node-dashboard.types'
import styles from '../HierarchyExperience.module.css'

export function NodeOverviewTab(props: NodeDashboardCommonProps) {
  return (
    <div className={styles.dashboardGrid}>
      <NodeManagerCard {...props} />
      <NodePerformanceCard {...props} />
    </div>
  )
}
