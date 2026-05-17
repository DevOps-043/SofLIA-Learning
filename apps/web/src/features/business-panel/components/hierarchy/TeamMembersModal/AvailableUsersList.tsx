import Image from 'next/image'
import { Check, Loader2, Search, User, UserPlus } from 'lucide-react'
import type { AvailableTeamUser, TeamMembersTheme } from './types'

interface AvailableUsersListProps {
  availableUsers: AvailableTeamUser[]
  isAssigning: boolean
  loadingUsers: boolean
  onAddMembers: () => void
  onSelectAll: () => void
  onToggleUser: (userId: string) => void
  searchTerm: string
  selectedUserIds: Set<string>
  setSearchTerm: (value: string) => void
  theme: TeamMembersTheme
}

export function AvailableUsersList({
  availableUsers,
  isAssigning,
  loadingUsers,
  onAddMembers,
  onSelectAll,
  onToggleUser,
  searchTerm,
  selectedUserIds,
  setSearchTerm,
  theme,
}: AvailableUsersListProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Agregar Miembros</h3>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Buscar usuarios..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      {availableUsers.length > 0 && (
        <button onClick={onSelectAll} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-3">
          {availableUsers.every((user) => selectedUserIds.has(user.id)) ? 'Deseleccionar todos' : 'Seleccionar todos'}
        </button>
      )}
      <div className="space-y-2 max-h-[400px] overflow-y-auto mb-4">
        {loadingUsers ? (
          <div className="text-center py-8"><Loader2 className="w-6 h-6 mx-auto animate-spin text-gray-400" /></div>
        ) : availableUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-white/40"><User className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>No hay usuarios disponibles</p></div>
        ) : availableUsers.map((user) => {
          const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
          const isSelected = selectedUserIds.has(user.id)
          return (
            <div key={user.id} onClick={() => onToggleUser(user.id)} className={`p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10'}`}>
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 flex-shrink-0">
                  {user.profile_picture_url ? <Image src={user.profile_picture_url} alt="" fill className="rounded-full object-cover" /> : <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold text-sm">{displayName.charAt(0)}</div>}
                </div>
                <div className="flex-1 min-w-0"><p className="font-medium text-gray-900 dark:text-white truncate">{displayName}</p><p className="text-xs text-gray-500 dark:text-white/50 truncate">{user.email}</p></div>
                {isSelected && <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />}
              </div>
            </div>
          )
        })}
      </div>
      <button onClick={onAddMembers} disabled={selectedUserIds.size === 0 || isAssigning} className="w-full py-2 px-4 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" style={{ background: selectedUserIds.size > 0 && !isAssigning ? `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})` : '#9CA3AF', textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}>
        {isAssigning ? <><Loader2 className="w-4 h-4 animate-spin" />Agregando...</> : <><UserPlus className="w-4 h-4" />Agregar {selectedUserIds.size > 0 ? `(${selectedUserIds.size})` : ''}</>}
      </button>
    </div>
  )
}
