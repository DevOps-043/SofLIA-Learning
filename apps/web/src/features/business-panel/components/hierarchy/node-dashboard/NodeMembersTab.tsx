'use client'

import { UserPlus, Users } from 'lucide-react'
import { NodeMemberCard } from './NodeMemberCard'
import type { NodeDashboardCommonProps } from './node-dashboard.types'

export function NodeMembersTab(props: NodeDashboardCommonProps) {
  const { state, t } = props
  const openMemberModal = () => { state.setInitialRole('member'); state.setShowMemberModal(true) }
  return (
    <div className="space-y-6"><div className="flex items-center justify-between"><div><h3 className="text-lg font-bold text-white">{t('hierarchy.dashboard.members.title')}</h3><p className="text-sm text-white/40">{t('hierarchy.dashboard.members.subtitle')}</p></div><button onClick={openMemberModal} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"><UserPlus className="h-4 w-4" />{t('hierarchy.dashboard.members.assign')}</button></div>{state.loadingMembers ? <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" /></div> : state.members.length === 0 ? <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-carbon-800 py-20 text-center"><Users className="mb-4 h-16 w-16 text-white/10" /><p className="font-medium text-white/40">{t('hierarchy.dashboard.members.empty')}</p></div> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{state.members.map((member) => <NodeMemberCard key={member.id} {...props} member={member} />)}</div>}</div>
  )
}
