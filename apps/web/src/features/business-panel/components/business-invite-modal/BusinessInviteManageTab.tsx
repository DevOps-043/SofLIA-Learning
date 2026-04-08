'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  MoreVertical,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type {
  BulkInviteLink,
  BusinessInviteRole,
  BusinessInviteStatusConfig,
} from '../../services/business-invite-modal.service'

const STATUS_ICONS = {
  'check-circle': CheckCircle,
  pause: Pause,
  clock: Clock,
  'x-circle': XCircle,
  'alert-circle': AlertCircle,
}

interface BusinessInviteManageTabProps {
  links: BulkInviteLink[]
  linksLoading: boolean
  linksError: string | null
  copiedId: string | null
  actionLoading: string | null
  openMenuId: string | null
  roleLabels: Record<BusinessInviteRole, { label: string; desc: string }>
  getInviteUrl: (token: string) => string
  getStatusConfig: (status: string) => BusinessInviteStatusConfig
  onDismissError: () => void
  onRefresh: () => Promise<void>
  onCopyLink: (token: string, linkId?: string) => Promise<void>
  onAction: (linkId: string, action: 'pause' | 'resume' | 'delete') => Promise<void>
  onCreateLink: () => void
  onToggleMenu: (linkId: string | null) => void
}

export function BusinessInviteManageTab({
  links,
  linksLoading,
  linksError,
  copiedId,
  actionLoading,
  openMenuId,
  roleLabels,
  getInviteUrl,
  getStatusConfig,
  onDismissError,
  onRefresh,
  onCopyLink,
  onAction,
  onCreateLink,
  onToggleMenu,
}: BusinessInviteManageTabProps) {
  const theme = useBusinessPanelTheme()
  const dangerSurface = theme.isDark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(239, 68, 68, 0.1)'

  return (
    <div className="p-6">
      {linksError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-3 rounded-xl border p-4"
          style={{
            backgroundColor: dangerSurface,
            borderColor: theme.dangerColor,
          }}
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: theme.dangerColor }} />
          <span className="flex-1 text-sm" style={{ color: theme.dangerColor }}>
            {linksError}
          </span>
          <button type="button" onClick={onDismissError}>
            <X className="h-4 w-4" style={{ color: theme.dangerColor }} />
          </button>
        </motion.div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm" style={{ color: theme.subtextColor }}>
          {links.length} {links.length === 1 ? 'enlace' : 'enlaces'} creados
        </p>
        <button
          type="button"
          onClick={() => void onRefresh()}
          disabled={linksLoading}
          className="rounded-lg p-2 transition-colors disabled:opacity-50"
          style={{ backgroundColor: 'transparent' }}
          title="Actualizar"
          onMouseEnter={(event) => {
            event.currentTarget.style.backgroundColor = theme.hoverBg
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <RefreshCw
            className={`h-4 w-4 ${linksLoading ? 'animate-spin' : ''}`}
            style={{ color: theme.subtextColor }}
          />
        </button>
      </div>

      {linksLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-xl border p-4"
              style={{
                backgroundColor: theme.inputBg,
                borderColor: theme.borderColor,
              }}
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg" style={{ backgroundColor: theme.hoverBg }} />
                <div className="flex-1">
                  <div
                    className="mb-2 h-4 w-32 rounded"
                    style={{ backgroundColor: theme.hoverBg }}
                  />
                  <div className="h-3 w-48 rounded" style={{ backgroundColor: theme.hoverBg }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : links.length === 0 ? (
        <div className="py-12 text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.inputBg }}
          >
            <Link2 className="h-8 w-8" style={{ color: theme.subtextColor }} />
          </div>
          <h4 className="mb-2 text-lg font-semibold" style={{ color: theme.textColor }}>
            No hay enlaces
          </h4>
          <p className="mb-6" style={{ color: theme.subtextColor }}>
            Crea tu primer enlace de invitacion masiva
          </p>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreateLink}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium"
            style={{
              backgroundColor: theme.primaryColor,
              color: theme.onPrimaryColor,
            }}
          >
            <Plus className="h-4 w-4" />
            Crear enlace
          </motion.button>
        </div>
      ) : (
        <div className="max-h-[400px] space-y-3 overflow-y-auto pr-1">
          {links.map((link) => {
            const statusConfig = getStatusConfig(link.status)
            const StatusIcon = STATUS_ICONS[statusConfig.icon]
            const isExpiredOrExhausted = link.status === 'expired' || link.status === 'exhausted'

            return (
              <div
                key={link.id}
                className="rounded-xl border p-4 transition-colors"
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.borderColor,
                  opacity: isExpiredOrExhausted ? 0.7 : 1,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="shrink-0 rounded-lg p-2"
                    style={{ backgroundColor: statusConfig.bgColor }}
                  >
                    <Link2 className="h-4 w-4" style={{ color: statusConfig.color }} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h4
                        className="truncate text-sm font-medium"
                        style={{ color: theme.textColor }}
                      >
                        {link.name || 'Sin nombre'}
                      </h4>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: statusConfig.bgColor,
                          color: statusConfig.color,
                        }}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="mb-2 flex items-center gap-2">
                      <p
                        className="flex-1 truncate font-mono text-xs"
                        style={{ color: theme.subtextColor }}
                      >
                        {getInviteUrl(link.token)}
                      </p>
                      <button
                        type="button"
                        onClick={() => void onCopyLink(link.token, link.id)}
                        className="rounded p-1 transition-colors"
                      >
                        {copiedId === link.id ? (
                          <Check className="h-3.5 w-3.5" style={{ color: theme.successColor }} />
                        ) : (
                          <Copy className="h-3.5 w-3.5" style={{ color: theme.subtextColor }} />
                        )}
                      </button>
                      <a
                        href={getInviteUrl(link.token)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded p-1 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" style={{ color: theme.subtextColor }} />
                      </a>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1" style={{ color: theme.subtextColor }}>
                        <Users className="h-3 w-3" />
                        {link.current_uses}/{link.max_uses}
                      </span>
                      <span className="flex items-center gap-1" style={{ color: theme.subtextColor }}>
                        <Shield className="h-3 w-3" />
                        {roleLabels[link.role as BusinessInviteRole]?.label || link.role}
                      </span>
                      <span className="flex items-center gap-1" style={{ color: theme.subtextColor }}>
                        <Calendar className="h-3 w-3" />
                        {new Date(link.expires_at).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleMenu(openMenuId === link.id ? null : link.id)}
                      disabled={actionLoading === link.id}
                      className="rounded-lg p-2 transition-colors disabled:opacity-50"
                      style={{ backgroundColor: 'transparent' }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.backgroundColor = theme.hoverBg
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      {actionLoading === link.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" style={{ color: theme.subtextColor }} />
                      ) : (
                        <MoreVertical className="h-4 w-4" style={{ color: theme.subtextColor }} />
                      )}
                    </button>

                    <AnimatePresence>
                      {openMenuId === link.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-xl border shadow-lg"
                          style={{
                            backgroundColor: theme.cardBg,
                            borderColor: theme.borderColor,
                          }}
                        >
                          {link.status === 'active' && (
                            <button
                              type="button"
                              onClick={() => void onAction(link.id, 'pause')}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors"
                              style={{ color: theme.textColor }}
                            >
                              <Pause className="h-4 w-4" style={{ color: theme.warningColor }} />
                              Pausar
                            </button>
                          )}

                          {link.status === 'paused' && (
                            <button
                              type="button"
                              onClick={() => void onAction(link.id, 'resume')}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors"
                              style={{ color: theme.textColor }}
                            >
                              <Play className="h-4 w-4" style={{ color: theme.successColor }} />
                              Reanudar
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => void onAction(link.id, 'delete')}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors"
                            style={{ color: theme.dangerColor }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
