'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartBarIcon } from '@heroicons/react/24/outline'
import { Card, colors } from '../shared'
import { createStatsTooltipStyle } from './StatsChartTooltip'

export function StatsActivityChartCard({
  activityMonthly,
  isDark,
}: {
  activityMonthly: Array<Record<string, unknown>>
  isDark: boolean
}) {
  return (
    <Card title="Engagement Temporal" description="Evolución de horas de aprendizaje (últimos 6 meses)" icon={ChartBarIcon} iconColor={colors.blue}>
      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={activityMonthly}>
            <defs>
              <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.blue} stopOpacity={0.4} />
                <stop offset="95%" stopColor={colors.blue} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: colors.grayMedium, fontSize: 10, fontWeight: 'bold' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: colors.grayMedium, fontSize: 10, fontWeight: 'bold' }} />
            <Tooltip contentStyle={createStatsTooltipStyle(isDark)} itemStyle={{ color: colors.accent, fontWeight: 'bold' }} />
            <Area type="monotone" dataKey="hours" stroke={colors.blue} strokeWidth={4} fillOpacity={1} fill="url(#colorHours)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
