'use client'

import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import type { NodeDashboardCommonProps } from './node-dashboard.types'

export function NodeChildrenCard({ state, t }: NodeDashboardCommonProps) {
  const children = state.data?.children || []
  return (
    <div className="rounded-2xl border border-white/5 bg-[#1E2329] p-6"><div className="mb-4 flex items-center justify-between"><h3 className="font-bold text-white">{t('hierarchy.dashboard.substructures.title')}</h3><span className="rounded bg-white/10 px-2 py-1 text-xs text-white/60">{children.length}</span></div>{children.length === 0 ? <p className="py-4 text-center text-sm text-white/40">{t('hierarchy.dashboard.substructures.empty')}</p> : <div className="custom-scrollbar max-h-[300px] space-y-2 overflow-y-auto pr-2">{children.map((child) => <Link key={child.id} href={`/${state.orgSlug}/business-panel/hierarchy/node/${child.id}`} className="group block rounded-xl border border-white/5 bg-[#2A3038] p-3 transition-all hover:bg-[#323842]"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-white transition-colors group-hover:text-blue-400">{child.name}</p><p className="text-xs capitalize text-white/40">{child.type}</p></div><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/20 transition-all group-hover:bg-blue-500/10 group-hover:text-blue-400"><TrendingUp className="h-4 w-4" /></div></div></Link>)}</div>}</div>
  )
}
