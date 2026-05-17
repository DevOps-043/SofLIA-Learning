'use client'

import { Map as MapIcon } from 'lucide-react'
import { HierarchyMapWrapper } from '../HierarchyMapWrapper'
import type { NodeDashboardCommonProps } from './node-dashboard.types'

export function NodeMapCard({ state, t }: NodeDashboardCommonProps) {
  const data = state.data
  if (!data) return null
  return <div className="relative min-h-[500px] overflow-hidden rounded-2xl border border-white/5 bg-[#1E2329] lg:col-span-2"><div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-white/10 bg-[#1E2329]/90 px-3 py-1.5 text-xs font-bold text-white backdrop-blur"><MapIcon className="h-3 w-3 text-blue-400" /><span>{t('hierarchy.map.title')}</span></div><HierarchyMapWrapper nodes={[data.node, ...data.children]} /></div>
}
