'use client'

import Link from 'next/link'
import { Edit2, MapPin } from 'lucide-react'
import type { NodeDashboardCommonProps } from './node-dashboard.types'

export function NodeDetailsCard({ state, t }: NodeDashboardCommonProps) {
  const data = state.data
  if (!data) return null
  const node = data.node
  const location = node.properties?.address || node.properties?.city || node.properties?.state || node.properties?.country || t('hierarchy.dashboard.details.notSpecified')
  return (
    <div className="rounded-2xl border border-white/5 bg-[#1E2329] p-6"><div className="mb-4 flex items-center justify-between"><h3 className="font-bold text-white">{t('hierarchy.dashboard.details.title')}</h3><button onClick={() => state.setShowEditModal(true)} className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white"><Edit2 className="h-4 w-4" /></button></div><div className="space-y-4"><Detail label={t('hierarchy.dashboard.details.name')} value={node.name} /><div><p className="mb-1 text-xs text-white/40">{t('hierarchy.dashboard.details.type')}</p><div className="flex items-center gap-2"><span className="capitalize text-white">{node.type}</span><span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${node.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{node.is_active ? t('hierarchy.dashboard.details.status.active') : t('hierarchy.dashboard.details.status.inactive')}</span></div></div><div><p className="mb-1 text-xs text-white/40">{t('hierarchy.dashboard.details.location')}</p><div className="flex items-center gap-2 text-white"><MapPin className="h-4 w-4 text-white/40" /><span>{location}</span></div></div><div><p className="mb-1 text-xs text-white/40">{t('hierarchy.dashboard.details.path')}</p><div className="flex items-center gap-1 overflow-x-auto pb-2 text-sm text-white/60">{data.path.map((p, index) => <div key={p.id} className="flex flex-shrink-0 items-center gap-1">{index > 0 ? <span className="text-white/20">/</span> : null}<Link href={`/${state.orgSlug}/business-panel/hierarchy/node/${p.id}`} className="transition-colors hover:text-blue-400">{p.name}</Link></div>)}</div></div></div></div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="mb-1 text-xs text-white/40">{label}</p><p className="font-medium text-white">{value}</p></div>
}
