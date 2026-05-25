'use client'

import { motion } from 'framer-motion'
import { Calendar, Check, Copy, ExternalLink, Link2, MoreVertical, Shield, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { BulkInviteLink, ManageInviteLinksState } from './invite-links.types'
import { getInviteLinkStatusConfig, getInviteRoleLabels } from './invite-links-status'
import { InviteLinkActionMenu } from './InviteLinkActionMenu'
import { useInviteLinksTheme } from './useInviteLinksTheme'

export function InviteLinkCard({ link, state }: { link: BulkInviteLink; state: ManageInviteLinksState }) {
  const { t } = useTranslation('business')
  const theme = useInviteLinksTheme()
  const statusConfig = getInviteLinkStatusConfig(link.status, t, { bgColor: theme.inputBg, color: theme.mutedText })
  const StatusIcon = statusConfig.icon
  const roleLabels = getInviteRoleLabels(t)
  const isExpiredOrExhausted = link.status === 'expired' || link.status === 'exhausted'

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl border transition-colors hover:border-opacity-50" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, opacity: isExpiredOrExhausted ? 0.7 : 1 }}>
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-lg shrink-0" style={{ backgroundColor: statusConfig.bgColor }}>
          <Link2 className="w-5 h-5" style={{ color: statusConfig.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate" style={{ color: theme.textColor }}>{link.name || t('users.modals.manageLinks.unnamed', 'Sin nombre')}</h4>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1" style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
          </div>
          <InviteLinkUrl link={link} state={state} />
          <div className="flex items-center gap-4 text-xs">
            <InviteLinkMeta icon={<Users className="w-3.5 h-3.5" />} text={`${link.current_uses}/${link.max_uses} ${t('users.modals.manageLinks.uses', 'usos')}`} />
            <InviteLinkMeta icon={<Shield className="w-3.5 h-3.5" />} text={roleLabels[link.role as keyof typeof roleLabels] || link.role} />
            <InviteLinkMeta icon={<Calendar className="w-3.5 h-3.5" />} text={new Date(link.expires_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} />
          </div>
        </div>
        <div className="relative shrink-0">
          <button onClick={() => state.setOpenMenuId(state.openMenuId === link.id ? null : link.id)} disabled={state.actionLoading === link.id} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50">
            {state.actionLoading === link.id ? <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /> : <MoreVertical className="w-5 h-5" style={{ color: theme.mutedText }} />}
          </button>
          <InviteLinkActionMenu link={link} menuRef={state.menuRef} onAction={state.handleAction} openMenuId={state.openMenuId} />
        </div>
      </div>
    </motion.div>
  )
}

function InviteLinkUrl({ link, state }: { link: BulkInviteLink; state: ManageInviteLinksState }) {
  const { t } = useTranslation('business')
  const theme = useInviteLinksTheme()
  const inviteUrl = state.getInviteUrl(link.token)
  return (
    <div className="flex items-center gap-2 mb-3">
      <p className="text-xs font-mono truncate flex-1" style={{ color: theme.mutedText }}>{inviteUrl}</p>
      <button onClick={() => void state.handleCopy(link)} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0" title={t('common.copy', 'Copiar')}>
        {state.copiedId === link.id ? <Check className="w-4 h-4" style={{ color: theme.accentColor }} /> : <Copy className="w-4 h-4" style={{ color: theme.mutedText }} />}
      </button>
      <a href={inviteUrl} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0" title={t('common.openInNewTab', 'Abrir en nueva pestaña')}>
        <ExternalLink className="w-4 h-4" style={{ color: theme.mutedText }} />
      </a>
    </div>
  )
}

function InviteLinkMeta({ icon, text }: { icon: ReactNode; text: string }) {
  const theme = useInviteLinksTheme()
  return <div className="flex items-center gap-1.5" style={{ color: theme.mutedText }}>{icon}<span>{text}</span></div>
}
