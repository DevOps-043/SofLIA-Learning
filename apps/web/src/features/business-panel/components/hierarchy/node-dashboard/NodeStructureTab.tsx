'use client'

import { NodeChildrenCard } from './NodeChildrenCard'
import { NodeDetailsCard } from './NodeDetailsCard'
import { NodeMapCard } from './NodeMapCard'
import type { NodeDashboardCommonProps } from './node-dashboard.types'

export function NodeStructureTab(props: NodeDashboardCommonProps) {
  return <div className="grid grid-cols-1 gap-6 lg:grid-cols-3"><div className="space-y-6 lg:col-span-1"><NodeDetailsCard {...props} /><NodeChildrenCard {...props} /></div><NodeMapCard {...props} /></div>
}
