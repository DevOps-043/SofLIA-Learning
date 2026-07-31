'use client'

import { NodeChildrenCard } from './NodeChildrenCard'
import { NodeDetailsCard } from './NodeDetailsCard'
import { NodeMapCard } from './NodeMapCard'
import type { NodeDashboardCommonProps } from './node-dashboard.types'
import styles from '../HierarchyExperience.module.css'

export function NodeStructureTab(props: NodeDashboardCommonProps) {
  return (
    <div className={styles.structureGrid}>
      <div className={styles.structureAside}>
        <NodeDetailsCard {...props} />
        <NodeChildrenCard {...props} />
      </div>
      <NodeMapCard {...props} />
    </div>
  )
}
