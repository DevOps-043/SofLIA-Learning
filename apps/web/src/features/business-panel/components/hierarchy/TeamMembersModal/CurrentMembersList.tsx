import Image from 'next/image'
import { Crown, Loader2, UserMinus, Users } from 'lucide-react'
import type { UserWithHierarchy } from '../../../types/hierarchy.types'

interface CurrentMembersListProps {
  currentMembers: UserWithHierarchy[]
  isRemoving: string | null
  onChangeRole: (userId: string, role: 'team_leader' | 'member') => void
  onRemoveMember: (userId: string) => void
}

export function CurrentMembersList({
  currentMembers,
  isRemoving,
  onChangeRole,
  onRemoveMember,
}: CurrentMembersListProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Miembros Actuales ({currentMembers.length})</h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {currentMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-white/40">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>No hay miembros en este equipo</p>
          </div>
        ) : currentMembers.map((member) => (
          <div key={member.id} className="p-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex items-center justify-between group">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative w-10 h-10 flex-shrink-0">
                {member.user?.profile_picture_url ? (
                  <Image src={member.user.profile_picture_url} alt="" fill className="rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {member.user?.display_name?.charAt(0) || member.user?.email.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{member.user?.display_name || member.user?.email}</p>
                  {member.role === 'team_leader' && <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                </div>
                <p className="text-xs text-gray-500 dark:text-white/50 truncate">{member.user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <select value={member.role || 'member'} onChange={(event) => onChangeRole(member.user_id, event.target.value as 'team_leader' | 'member')} className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white" disabled={isRemoving === member.user_id}>
                <option value="member">Miembro</option><option value="team_leader">Líder</option>
              </select>
              <button onClick={() => onRemoveMember(member.user_id)} disabled={isRemoving === member.user_id} className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50" title="Remover del equipo">
                {isRemoving === member.user_id ? <Loader2 className="w-4 h-4 text-red-500 animate-spin" /> : <UserMinus className="w-4 h-4 text-red-500" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
