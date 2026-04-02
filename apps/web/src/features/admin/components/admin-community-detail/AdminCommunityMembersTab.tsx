import { CheckIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { AdminCommunityMember } from '../../types/admin-community-detail.types'
import { getAdminCommunityRoleColor, getAdminCommunityStatusColor } from './shared'

interface AdminCommunityMembersTabProps {
  members: AdminCommunityMember[]
  isProcessing: string | null
  onToggleMemberRole: (memberId: string, currentRole: string) => void
  onRemoveMember: (memberId: string, memberName: string) => void
}

function getMemberName(member: AdminCommunityMember) {
  return (
    member.name ||
    member.users?.display_name ||
    `${member.users?.first_name || ''} ${member.users?.last_name || ''}`.trim() ||
    member.users?.email ||
    'Usuario no encontrado'
  )
}

export function AdminCommunityMembersTab({
  members,
  isProcessing,
  onToggleMemberRole,
  onRemoveMember
}: AdminCommunityMembersTabProps) {
  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <UserGroupIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No hay miembros en esta comunidad</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {members.map(member => (
        <div key={member.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <UserGroupIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-gray-900 dark:text-white font-medium truncate">{getMemberName(member)}</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm truncate">{member.users?.email || `ID: ${member.id}`}</p>
              <div className="flex items-center flex-wrap gap-2 mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getAdminCommunityRoleColor(member.role)}`}>
                  {member.role}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getAdminCommunityStatusColor('Activa')}`}>
                  Activo
                </span>
              </div>
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => onToggleMemberRole(member.id, member.role)}
                disabled={isProcessing === member.id}
                className="p-1 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={member.role === 'admin' ? 'Degradar a miembro' : 'Promover a admin'}
              >
                {isProcessing === member.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 dark:border-green-400" />
                ) : (
                  <CheckIcon className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => onRemoveMember(member.id, getMemberName(member))}
                disabled={isProcessing === member.id}
                className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Remover de la comunidad"
              >
                {isProcessing === member.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 dark:border-red-400" />
                ) : (
                  <XMarkIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500 dark:text-gray-500">
            Se unio: {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      ))}
    </div>
  )
}
