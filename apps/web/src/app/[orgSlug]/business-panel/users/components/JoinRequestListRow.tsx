'use client'

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
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import type { JoinRequest } from '@/features/business-panel/services/joinRequests.service'

interface JoinRequestListRowProps {
  request: JoinRequest
  index: number
  isReviewing: boolean
  onApprove: () => void
  onReject: () => void
}

export function JoinRequestListRow({
  request,
  index,
  isReviewing,
  onApprove,
  onReject,
}: JoinRequestListRowProps) {
  const theme = useBusinessPanelTheme()
  const displayName = request.users
    ? [request.users.first_name, request.users.last_name]
        .filter(Boolean)
        .join(' ')
        .trim() || request.users.username
    : 'Usuario'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="flex items-center gap-4 p-4 rounded-xl border transition-all group"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0"
        style={{
          backgroundColor: theme.actionSurface,
          borderColor: `${theme.actionColor}20`,
        }}
      >
        <UserPlus className="w-5 h-5" style={{ color: theme.actionColor }} />
      </div>

      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
        <div className="min-w-0 col-span-1 lg:col-span-2">
          <div className="font-semibold text-sm truncate" style={{ color: theme.textColor }}>
            {displayName}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs" style={{ color: theme.subtextColor }}>
            <span className="inline-flex items-center gap-1 truncate">
              <Mail className="w-3 h-3" />
              {request.users?.email || 'Sin correo'}
            </span>
            {request.job_title && (
              <span className="inline-flex items-center gap-1 truncate">
                <Briefcase className="w-3 h-3" />
                {request.job_title}
              </span>
            )}
          </div>
        </div>

        <div className="hidden lg:block text-xs truncate" style={{ color: theme.subtextColor }}>
          {request.message ? (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              "{request.message}"
            </span>
          ) : (
            'Sin mensaje'
          )}
        </div>

        <div className="flex items-center gap-2">
          <span
            className="px-2 py-1 rounded-full text-[10px] font-bold border"
            style={{
              backgroundColor: `${theme.actionColor}12`,
              borderColor: `${theme.actionColor}20`,
              color: theme.actionColor,
            }}
          >
            Pendiente
          </span>
        </div>

        <div className="hidden sm:flex items-center justify-end gap-1 text-xs" style={{ color: theme.subtextColor }}>
          <Clock3 className="w-3 h-3" />
          {new Date(request.created_at).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={onApprove}
          disabled={isReviewing}
          className="p-2 rounded-lg transition-colors disabled:opacity-60"
          style={{
            backgroundColor: theme.actionSurface,
            color: theme.actionColor,
          }}
          title="Aprobar"
        >
          {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </button>
        <button
          onClick={onReject}
          disabled={isReviewing}
          className="p-2 rounded-lg transition-colors disabled:opacity-60"
          style={{
            backgroundColor: `${theme.dangerColor}10`,
            color: theme.dangerColor,
          }}
          title="Rechazar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}
