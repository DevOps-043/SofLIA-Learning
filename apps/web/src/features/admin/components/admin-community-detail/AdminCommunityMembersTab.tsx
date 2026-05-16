import { Check, UserRound, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminCommunityMember } from '../../types/admin-community-detail.types'
import {
  formatCommunityDetailDate,
  getCommunityDetailRoleConfig,
  getCommunityDetailStatusConfig,
} from './shared'

interface AdminCommunityMembersTabProps {
  isProcessing: string | null
  members: AdminCommunityMember[]
  onRemoveMember: (memberId: string, memberName: string) => void
  onToggleMemberRole: (memberId: string, currentRole: string) => void
}

export function AdminCommunityMembersTab({
  isProcessing,
  members,
  onRemoveMember,
  onToggleMemberRole,
}: AdminCommunityMembersTabProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  function getMemberName(member: AdminCommunityMember) {
    return (
      member.name ||
      member.users?.display_name ||
      `${member.users?.first_name || ''} ${member.users?.last_name || ''}`.trim() ||
      member.users?.email ||
      t('communityDetail.members.userNotFound')
    )
  }

  if (members.length === 0) {
    return (
      <div className="py-10 text-center">
        <UserRound
          className="mx-auto mb-4 h-12 w-12"
          style={{ color: theme.subtextColor }}
        />
        <p className="text-sm" style={{ color: theme.subtextColor }}>
          {t('communityDetail.members.empty')}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {members.map((member) => {
        const memberName = getMemberName(member)
        const roleConfig = getCommunityDetailRoleConfig(member.role, theme)
        const statusConfig = getCommunityDetailStatusConfig(true, theme)

        return (
          <div
            className="rounded-2xl border p-4"
            key={member.id}
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.borderColor,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.actionSurface }}
              >
                <UserRound
                  className="h-5 w-5"
                  style={{ color: theme.primaryColor }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className="truncate font-semibold"
                  style={{ color: theme.textColor }}
                >
                  {memberName}
                </p>
                <p className="truncate text-sm" style={{ color: theme.subtextColor }}>
                  {member.users?.email || `ID: ${member.id}`}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex rounded-full border px-2 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: roleConfig.bg,
                      borderColor: roleConfig.border,
                      color: roleConfig.color,
                    }}
                  >
                    {member.role}
                  </span>
                  <span
                    className="inline-flex rounded-full border px-2 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: statusConfig.bg,
                      borderColor: statusConfig.border,
                      color: statusConfig.color,
                    }}
                  >
                    {t('communityDetail.members.activeStatus')}
                  </span>
                </div>
              </div>

              <div className="flex gap-1">
                <button
                  disabled={isProcessing === member.id}
                  onClick={() => onToggleMemberRole(member.id, member.role)}
                  style={{ color: theme.successColor }}
                  title={
                    member.role === 'admin'
                      ? t('communityDetail.members.demoteToMember')
                      : t('communityDetail.members.promoteToAdmin')
                  }
                  type="button"
                >
                  {isProcessing === member.id ? (
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
                  disabled={isProcessing === member.id}
                  onClick={() => onRemoveMember(member.id, memberName)}
                  style={{ color: theme.dangerColor }}
                  title={t('communityDetail.members.removeFromCommunity')}
                  type="button"
                >
                  {isProcessing === member.id ? (
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

            <div className="mt-3 text-xs" style={{ color: theme.subtextColor }}>
              {t('communityDetail.members.joinedAt')}{' '}
              {formatCommunityDetailDate(member.joined_at) ||
                t('communityCard.noDate')}
            </div>
          </div>
        )
      })}
    </div>
  )
}
