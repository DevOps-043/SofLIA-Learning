'use client'

import { NodeManagerCard } from './NodeManagerCard'
import { NodePerformanceCard } from './NodePerformanceCard'
import type { NodeDashboardCommonProps } from './node-dashboard.types'

export function NodeOverviewTab(props: NodeDashboardCommonProps) {
  return <div className="grid grid-cols-1 gap-6 lg:grid-cols-3"><div className="min-h-[500px] lg:col-span-1"><NodeManagerCard {...props} /></div><div className="min-h-[500px] lg:col-span-2"><NodePerformanceCard {...props} /></div></div>
}
