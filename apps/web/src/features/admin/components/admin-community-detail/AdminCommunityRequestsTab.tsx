import { Check, UserPlus, UserRound, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminCommunityAccessRequest } from '../../types/admin-community-detail.types'
import {
  formatCommunityDetailDate,
  getCommunityDetailRequestStatusConfig,
} from './shared'

interface AdminCommunityRequestsTabProps {
  accessRequests: AdminCommunityAccessRequest[]
  isProcessing: string | null
  onApproveRequest: (requestId: string, requesterName: string) => void
  onOpenInviteModal: () => void
  onRejectRequest: (requestId: string, requesterName: string) => void
}

function getRequesterName(
  request: AdminCommunityAccessRequest,
  fallback: string,
) {
  return (
    request.requester?.display_name ||
    `${request.requester?.first_name || ''} ${request.requester?.last_name || ''}`.trim() ||
    request.requester?.email ||
    fallback
  )
}

export function AdminCommunityRequestsTab({
  accessRequests,
  isProcessing,
  onApproveRequest,
  onOpenInviteModal,
  onRejectRequest,
}: AdminCommunityRequestsTabProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-bold" style={{ color: theme.textColor }}>
          {t('communityDetail.requests.title')}
        </h3>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
          onClick={onOpenInviteModal}
          style={{
            backgroundColor: theme.primaryColor,
            color: theme.onPrimaryColor,
          }}
          type="button"
        >
          <UserPlus className="h-4 w-4" />
          {t('communityDetail.requests.inviteUser')}
        </button>
      </div>

      {accessRequests.length === 0 ? (
        <div className="py-10 text-center">
          <UserPlus
            className="mx-auto mb-4 h-12 w-12"
            style={{ color: theme.subtextColor }}
          />
          <p className="text-sm font-medium" style={{ color: theme.subtextColor }}>
            {t('communityDetail.requests.empty')}
          </p>
          <p className="mt-2 text-xs" style={{ color: theme.mutedTextColor }}>
            {t('communityDetail.requests.emptyDescription')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {accessRequests.map((request) => {
            const requesterName = getRequesterName(
              request,
              t('communityDetail.requests.userNotFound'),
            )
            const statusConfig = getCommunityDetailRequestStatusConfig(
              request.status,
              theme,
            )
            const isPending = request.status === 'pending'

            return (
              <div
                className="rounded-2xl border p-4"
                key={request.id}
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.borderColor,
                }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="shrink-0">
                      {request.requester?.profile_picture_url ? (
                        <img
                          alt={requesterName}
                          className="h-10 w-10 rounded-full object-cover"
                          src={request.requester.profile_picture_url}
                        />
                      ) : (
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full"
                          style={{ backgroundColor: theme.actionSurface }}
                        >
                          <UserRound
                            className="h-5 w-5"
                            style={{ color: theme.primaryColor }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold" style={{ color: theme.textColor }}>
                        {requesterName}
                      </p>
                      <p className="text-sm" style={{ color: theme.subtextColor }}>
                        {request.requester?.email}
                      </p>
                      {request.note ? (
                        <p
                          className="mt-2 text-sm"
                          style={{ color: theme.textColor }}
                        >
                          {request.note}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex rounded-full border px-2 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: statusConfig.bg,
                            borderColor: statusConfig.border,
                            color: statusConfig.color,
                          }}
                        >
                          {t(`communityDetail.requests.status.${request.status}`, {
                            defaultValue: request.status,
                          })}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: theme.subtextColor }}
                        >
                          {formatCommunityDetailDate(request.created_at) ||
                            t('communityCard.noDate')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      disabled={isProcessing === request.id || !isPending}
                      onClick={() => onApproveRequest(request.id, requesterName)}
                      style={{ color: theme.successColor }}
                      title={
                        isPending
                          ? t('communityDetail.requests.approve')
                          : t('communityDetail.requests.alreadyProcessed')
                      }
                      type="button"
                    >
                      {isProcessing === request.id ? (
                        <span
                          className="block h-4 w-4 animate-spin rounded-full border-2"
                          style={{
                            borderColor: `${theme.successColor}33`,
                            borderTopColor: theme.successColor,
                          }}
                        />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      disabled={isProcessing === request.id || !isPending}
                      onClick={() => onRejectRequest(request.id, requesterName)}
                      style={{ color: theme.dangerColor }}
                      title={
                        isPending
                          ? t('communityDetail.requests.reject')
                          : t('communityDetail.requests.alreadyProcessed')
                      }
                      type="button"
                    >
                      {isProcessing === request.id ? (
                        <span
                          className="block h-4 w-4 animate-spin rounded-full border-2"
                          style={{
                            borderColor: `${theme.dangerColor}33`,
                            borderTopColor: theme.dangerColor,
                          }}
                        />
                      ) : (
                        <X className="h-4 w-4" />
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
