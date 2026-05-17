'use client'

import { Edit2, User } from 'lucide-react'
import type { NodeDashboardCommonProps } from './node-dashboard.types'

export function NodeManagerCard({ state, t }: NodeDashboardCommonProps) {
  const node = state.data?.node
  if (!node) return null
  const assignManager = () => { state.setInitialRole('leader'); state.setShowMemberModal(true) }
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#1E2329] p-6">
      <div className="absolute right-0 top-0 p-4 opacity-0 transition-opacity group-hover:opacity-100"><button onClick={assignManager} className="rounded-lg bg-white/5 p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white" title={t('hierarchy.dashboard.manager.change')}><Edit2 className="h-4 w-4" /></button></div>
      <div className="mb-6"><h3 className="mb-1 text-lg font-bold text-white">{t('hierarchy.dashboard.manager.title')}</h3><p className="text-sm text-white/40">{t('hierarchy.dashboard.manager.subtitle')}</p></div>
      {node.manager ? <div className="flex flex-1 flex-col items-center justify-center text-center"><div className="mb-4 h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[2px]"><div className="relative h-full w-full overflow-hidden rounded-full bg-[#1E2329]">{node.manager.profile_picture_url ? <img src={node.manager.profile_picture_url} alt={node.manager.first_name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">{node.manager.first_name?.[0]}</div>}</div></div><h4 className="mb-1 text-xl font-bold text-white">{node.manager.first_name} {node.manager.last_name}</h4><p className="mb-4 text-sm font-medium text-blue-400">{node.manager.email}</p><div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-sm text-white/40"><User className="h-4 w-4" /><span>{t('hierarchy.dashboard.manager.roleLabel', { type: node.type })}</span></div></div> : <div className="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/5 py-8 text-center"><div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5"><User className="h-8 w-8 text-white/20" /></div><p className="mb-4 text-white/40">{t('hierarchy.dashboard.manager.notAssigned')}</p><button onClick={assignManager} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700">{t('hierarchy.dashboard.manager.assign')}</button></div>}
    </div>
  )
}
