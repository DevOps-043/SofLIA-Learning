'use client'

import { CheckIcon, UserGroupIcon, UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { CommunityAccessRequest } from '../../types/instructor-community-detail.types'
import { getRequestStatusColor } from './shared'

interface InstructorCommunityRequestsTabProps {
  accessRequests: CommunityAccessRequest[]
  isProcessing: string | null
  onOpenInviteModal: () => void
  onApproveRequest: (requestId: string, requesterName: string) => void
  onRejectRequest: (requestId: string, requesterName: string) => void
}

function getRequesterName(request: CommunityAccessRequest) {
  return request.requester?.display_name || `${request.requester?.first_name} ${request.requester?.last_name}`.trim()
}

export function InstructorCommunityRequestsTab({
  accessRequests,
  isProcessing,
  onOpenInviteModal,
  onApproveRequest,
  onRejectRequest
}: InstructorCommunityRequestsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Solicitudes de Acceso</h3>
        <button
          onClick={onOpenInviteModal}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30"
        >
          <UserPlusIcon className="h-4 w-4 mr-2" />
          Invitar Usuario
        </button>
      </div>
      {accessRequests.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex p-4 rounded-full bg-gray-700/50 mb-4">
            <UserPlusIcon className="h-12 w-12 text-gray-400" />
          </div>
          <p className="text-gray-400 text-lg mb-1">No hay solicitudes pendientes</p>
          <p className="text-gray-500 text-sm">Usa el botón "Invitar Usuario" para agregar miembros directamente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {accessRequests.map(request => {
            const requesterName = getRequesterName(request)

            return (
              <div key={request.id} className="bg-gradient-to-br from-gray-700/50 to-gray-800/30 rounded-xl border border-gray-600/30 p-4 hover:border-blue-500/50 transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {request.requester?.profile_picture_url ? (
                        <img
                          src={request.requester.profile_picture_url}
                          alt={request.requester.display_name || requesterName}
                          className="h-10 w-10 rounded-full object-cover border border-gray-600/30"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center border border-gray-500/30">
                          <UserGroupIcon className="h-6 w-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{requesterName}</p>
                      <p className="text-gray-400 text-sm">{request.requester?.email}</p>
                      {request.note ? <p className="text-gray-300 text-sm mt-2 bg-gray-700/30 p-2 rounded-lg">{request.note}</p> : null}
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${getRequestStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                        <span className="text-xs text-gray-500">{new Date(request.created_at).toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onApproveRequest(request.id, requesterName)}
                      disabled={isProcessing === request.id || request.status !== 'pending'}
                      className="p-2.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={request.status === 'pending' ? 'Aprobar solicitud' : 'Solicitud ya procesada'}
                    >
                      {isProcessing === request.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-400"></div>
                      ) : (
                        <CheckIcon className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => onRejectRequest(request.id, requesterName)}
                      disabled={isProcessing === request.id || request.status !== 'pending'}
                      className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={request.status === 'pending' ? 'Rechazar solicitud' : 'Solicitud ya procesada'}
                    >
                      {isProcessing === request.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-400"></div>
                      ) : (
                        <XMarkIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
