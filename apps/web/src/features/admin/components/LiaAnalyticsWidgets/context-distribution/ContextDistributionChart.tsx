'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { ContextDistributionTooltip } from './ContextDistributionTooltip'
import type { ChartContextData } from './types'

interface ContextDistributionChartProps {
  data: ChartContextData[]
}

export function ContextDistributionChart({ data }: ContextDistributionChartProps) {
  return (
    <div className="h-56 w-full lg:w-1/2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="count">
            {data.map((entry, index) => <Cell key={`${entry.contextType}-${index}`} fill={entry.color} />)}
          </Pie>
          <Tooltip content={<ContextDistributionTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
