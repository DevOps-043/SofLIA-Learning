'use client'

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { UsersIcon } from '@heroicons/react/24/outline'
import { Card, colors } from '../shared'
import { createStatsTooltipStyle } from './StatsChartTooltip'

const CHART_COLORS = [colors.accent, colors.purple, colors.blue, colors.success, colors.error, colors.warning]

export function StatsTeamDistributionCard({
  isDark,
  teamDistribution,
}: {
  isDark: boolean
  teamDistribution: Array<Record<string, unknown>>
}) {
  return (
    <Card title="Distribución por Equipos" description="Participación según departamento o zona" icon={UsersIcon} iconColor={colors.success}>
      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={teamDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
              {teamDistribution.map((_entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={createStatsTooltipStyle(isDark)} />
            <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-white/60">{value}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
