'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  Briefcase,
  Check,
  Clock3,
  Loader2,
  Mail,
  MessageSquare,
  UserPlus,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import type { JoinRequest } from '@/features/business-panel/services/joinRequests.service'
import { formatDate } from '@/shared/utils/date-formatter'

interface JoinRequestCardProps {
  request: JoinRequest
  index: number
  isReviewing: boolean
  onApprove: () => void
  onReject: () => void
}

export function JoinRequestCard({
  request,
  index,
  isReviewing,
  onApprove,
  onReject,
}: JoinRequestCardProps) {
  const { t, i18n } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const displayName = request.users
    ? [request.users.first_name, request.users.last_name]
        .filter(Boolean)
        .join(' ')
        .trim() || request.users.username
    : t('users.card.user')
  const initials = (
    request.users?.first_name?.[0] ||
    request.users?.email?.[0] ||
    displayName[0] ||
    'U'
  ).toUpperCase()

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.45 }}
      whileHover={{ y: -6 }}
      className="group relative flex flex-col rounded-3xl border overflow-hidden"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
        boxShadow: theme.isDark
          ? '0 20px 40px -20px rgba(0,0,0,0.5)'
          : '0 10px 20px -10px rgba(0,0,0,0.05)',
      }}
    >
      <div className="relative h-24 flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 blur-2xl"
          style={{
            background: `radial-gradient(circle, ${theme.actionColor} 0%, transparent 70%)`,
          }}
        />
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center border-2 shadow-2xl relative z-10 overflow-hidden"
          style={{
            backgroundColor: theme.inputBg,
            borderColor: theme.borderColor,
          }}
        >
          {request.users?.avatar_url ? (
            <img
              src={request.users.avatar_url}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-lg font-black" style={{ color: theme.actionColor }}>
              {initials}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 pt-0">
        <div className="text-center mb-4">
          <h4
            className="font-bold text-base tracking-tight truncate mb-0.5"
            style={{ color: theme.textColor }}
          >
            {displayName}
          </h4>
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
            style={{
              backgroundColor: `color-mix(in srgb, ${theme.actionColor} 7.8%, transparent)`,
              color: theme.actionColor,
            }}
          >
            <UserPlus className="w-2.5 h-2.5" />
            {t('users.card.pending')}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <InfoRow
            icon={<Mail className="w-3.5 h-3.5" />}
            value={request.users?.email || t('users.card.noEmail')}
          />
          {request.job_title && (
            <InfoRow
              icon={<Briefcase className="w-3.5 h-3.5" />}
              value={request.job_title}
            />
          )}
          {request.message && (
            <InfoRow
              icon={<MessageSquare className="w-3.5 h-3.5" />}
              value={`"${request.message}"`}
              italic
            />
          )}
          <InfoRow
            icon={<Clock3 className="w-3.5 h-3.5" />}
            value={formatDate(request.created_at, i18n.language, {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2">
          <button
            onClick={onApprove}
            disabled={isReviewing}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 disabled:opacity-60"
            style={{
              backgroundColor: theme.actionColor,
              color: theme.onActionColor,
            }}
          >
            {isReviewing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {t('users.card.approve')}
          </button>
          <button
            onClick={onReject}
            disabled={isReviewing}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-colors disabled:opacity-60"
            style={{
              backgroundColor: `color-mix(in srgb, ${theme.dangerColor} 6.3%, transparent)`,
              border: `1px solid color-mix(in srgb, ${theme.dangerColor} 12.5%, transparent)`,
              color: theme.dangerColor,
            }}
          >
            <X className="w-4 h-4" />
            {t('users.card.reject')}
          </button>
        </div>
      </div>
    </motion.article>
  )
}

function InfoRow({
  icon,
  value,
  italic = false,
}: {
  icon: ReactNode
  value: string
  italic?: boolean
}) {
  const theme = useBusinessPanelTheme()

  return (
    <div
      className="flex items-start gap-2 px-3 py-2 rounded-xl border text-xs"
      style={{
        backgroundColor: theme.hoverBg,
        borderColor: theme.borderColor,
        color: theme.subtextColor,
      }}
    >
      <span className="mt-0.5 shrink-0" style={{ color: theme.mutedTextColor }}>
        {icon}
      </span>
      <span className={italic ? 'italic leading-relaxed' : 'leading-relaxed'}>{value}</span>
    </div>
  )
}
