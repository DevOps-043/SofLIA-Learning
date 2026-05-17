'use client'

import { Trash2 } from 'lucide-react'
import type { NodeMember } from '../../../types/hierarchy.types'
import type { NodeDashboardCommonProps } from './node-dashboard.types'

export function NodeMemberCard({ member, state, t, tc }: NodeDashboardCommonProps & { member: NodeMember }) {
  const nameInitial = (member.users.first_name?.[0] || member.users.username?.[0] || '?').toUpperCase()
  return (
    <div className="group flex items-center gap-4 rounded-xl border border-white/5 bg-[#1E2329] p-4 transition-colors hover:border-white/10"><div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-[#2A3038]">{member.users.profile_picture_url ? <img src={member.users.profile_picture_url} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center font-bold text-white/20">{nameInitial}</div>}</div><div className="min-w-0 flex-1"><h4 className="truncate font-bold text-white">{member.users.first_name} {member.users.last_name}</h4><p className="truncate text-xs text-white/40">{member.users.email}</p><div className="mt-1 flex items-center gap-2"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${member.role === 'leader' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>{member.role === 'leader' ? t('hierarchy.dashboard.members.role.leader') : t('hierarchy.dashboard.members.role.member')}</span></div></div>{state.pendingRemoveMemberId === member.user_id ? <div className="flex items-center gap-1"><span className="text-xs text-red-400">{t('hierarchy.confirmRemoveMember')}</span><button onClick={() => state.setPendingRemoveMemberId(null)} className="rounded border border-white/10 px-2 py-1 text-xs text-white/60 transition-colors hover:bg-white/5">{tc('actions.cancel')}</button><button onClick={state.handleConfirmRemoveMember} className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/30">{tc('actions.confirm')}</button></div> : <button onClick={() => state.handleRemoveMember(member.user_id)} className="rounded-lg p-2 text-white/20 opacity-0 transition-colors hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100" title={t('hierarchy.confirmRemoveMember')}><Trash2 className="h-4 w-4" /></button>}</div>
  )
}
