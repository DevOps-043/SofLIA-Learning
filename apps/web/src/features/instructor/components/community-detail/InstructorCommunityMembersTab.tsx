'use client'

import { CheckIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { CommunityMember } from '../../types/instructor-community-detail.types'
import { getRoleColor, getStatusColor } from './shared'

interface InstructorCommunityMembersTabProps {
  members: CommunityMember[]
  isProcessing: string | null
  onToggleMemberRole: (memberId: string, currentRole: string) => void
  onRemoveMember: (memberId: string, memberName: string) => void
}

export function InstructorCommunityMembersTab({
  members,
  isProcessing,
  onToggleMemberRole,
  onRemoveMember
}: InstructorCommunityMembersTabProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Miembros de la Comunidad</h3>
      {members.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex p-4 rounded-full bg-gray-700/50 mb-4">
            <UserGroupIcon className="h-12 w-12 text-gray-400" />
          </div>
          <p className="text-gray-400 text-lg mb-1">No hay miembros en esta comunidad</p>
          <p className="text-gray-500 text-sm">Los miembros aparecerán aquí cuando se unan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(member => (
            <div key={member.id} className="bg-gradient-to-br from-gray-700/50 to-gray-800/30 rounded-xl border border-gray-600/30 p-4 hover:border-blue-500/50 transition-all duration-200">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center border border-gray-500/30">
                    <UserGroupIcon className="h-6 w-6 text-gray-300" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{member.name || 'Usuario no encontrado'}</p>
                  <p className="text-gray-400 text-xs truncate">{member.users?.email || 'Sin email'}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(member.role)}`}>{member.role}</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor('Activa')}`}>Activo</span>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => onToggleMemberRole(member.id, member.role)}
                    disabled={isProcessing === member.id}
                    className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={member.role === 'admin' ? 'Degradar a miembro' : 'Promover a admin'}
                  >
                    {isProcessing === member.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                    ) : (
                      <CheckIcon className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => onRemoveMember(member.id, member.name || 'Usuario')}
                    disabled={isProcessing === member.id}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remover de la comunidad"
                  >
                    {isProcessing === member.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                    ) : (
                      <XMarkIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 pt-3 border-t border-gray-600/30">
                Se unió: {member.joined_at ? new Date(member.joined_at).toLocaleDateString('es-ES') : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
