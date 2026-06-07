'use client'

import { TrendingUp } from 'lucide-react'
import type { NodeDashboardCommonProps } from './node-dashboard.types'

export function NodePerformanceCard({ state, t }: NodeDashboardCommonProps) {
  const node = state.data?.node
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/5 bg-carbon-800 p-6">
      <div className="mb-6 flex items-center justify-between"><div><h3 className="mb-1 text-lg font-bold text-white">{t('hierarchy.dashboard.performance.title')}</h3><p className="text-sm text-white/40">{t('hierarchy.dashboard.performance.subtitle', { type: node?.type })}</p></div><div className="rounded-lg bg-emerald-500/10 p-2"><TrendingUp className="h-5 w-5 text-emerald-400" /></div></div>
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">{buildPerformanceStats(state, t).map((item) => <div key={item.label} className="rounded-xl border border-white/5 bg-gray-700 p-4"><p className="mb-1 text-xs text-white/40">{item.label}</p><div className="flex items-end gap-2"><span className="text-2xl font-bold text-white">{item.value}</span>{item.delta ? <span className="mb-1 text-xs text-emerald-400">{item.delta}</span> : null}</div></div>)}</div>
      <div className="flex flex-1 items-center justify-center rounded-xl border border-white/5 bg-gray-700 p-4"><p className="text-sm text-white/20">{t('hierarchy.dashboard.performance.chartComingSoon')}</p></div>
    </div>
  )
}

function buildPerformanceStats(state: NodeDashboardCommonProps['state'], t: NodeDashboardCommonProps['t']) {
  return [
    { label: t('hierarchy.dashboard.performance.avgProgress'), value: `${state.analytics?.avg_completion || 0}%`, delta: '+2.4%' },
    { label: t('hierarchy.dashboard.performance.completedCourses'), value: state.analytics?.courses_completed || 0 },
    { label: t('hierarchy.dashboard.performance.learningHours'), value: `${state.analytics?.total_hours || 0}h` },
  ]
}
