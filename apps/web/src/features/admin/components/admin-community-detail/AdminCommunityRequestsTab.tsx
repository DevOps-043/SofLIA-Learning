import { CheckIcon, UserGroupIcon, UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { AdminCommunityAccessRequest } from '../../types/admin-community-detail.types'
import { getAdminCommunityRequestStatusColor } from './shared'

interface AdminCommunityRequestsTabProps {
  accessRequests: AdminCommunityAccessRequest[]
  isProcessing: string | null
  onOpenInviteModal: () => void
  onApproveRequest: (requestId: string, requesterName: string) => void
  onRejectRequest: (requestId: string, requesterName: string) => void
}

function getRequesterName(request: AdminCommunityAccessRequest) {
  return (
    request.requester?.display_name ||
    `${request.requester?.first_name || ''} ${request.requester?.last_name || ''}`.trim() ||
    request.requester?.email ||
    'Usuario desconocido'
  )
}

export function AdminCommunityRequestsTab({
  accessRequests,
  isProcessing,
  onOpenInviteModal,
  onApproveRequest,
  onRejectRequest
}: AdminCommunityRequestsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Solicitudes de Acceso</h3>
        <button
          onClick={onOpenInviteModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <UserPlusIcon className="h-4 w-4 mr-2" />
          Invitar Usuario
        </button>
      </div>

      {accessRequests.length === 0 ? (
        <div className="text-center py-8">
          <UserPlusIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No hay solicitudes pendientes</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Usa "Invitar Usuario" para agregar miembros directamente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {accessRequests.map(request => {
            const requesterName = getRequesterName(request)

            return (
              <div key={request.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {request.requester?.profile_picture_url ? (
                        <img
                          src={request.requester.profile_picture_url}
                          alt={requesterName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <UserGroupIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-white font-medium">{requesterName}</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{request.requester?.email}</p>
                      {request.note ? (
                        <p className="text-gray-700 dark:text-gray-300 text-sm mt-2">{request.note}</p>
                      ) : null}
                      <div className="flex items-center flex-wrap gap-2 mt-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getAdminCommunityRequestStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onApproveRequest(request.id, requesterName)}
                      disabled={isProcessing === request.id || request.status !== 'pending'}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={request.status === 'pending' ? 'Aprobar solicitud' : 'Solicitud ya procesada'}
                    >
                      {isProcessing === request.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 dark:border-green-400" />
                      ) : (
                        <CheckIcon className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => onRejectRequest(request.id, requesterName)}
                      disabled={isProcessing === request.id || request.status !== 'pending'}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={request.status === 'pending' ? 'Rechazar solicitud' : 'Solicitud ya procesada'}
                    >
                      {isProcessing === request.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 dark:border-red-400" />
                      ) : (
                        <XMarkIcon className="h-4 w-4" />
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
