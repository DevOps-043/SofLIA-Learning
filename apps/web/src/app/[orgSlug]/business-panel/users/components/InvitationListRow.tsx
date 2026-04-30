'use client'

import { motion } from 'framer-motion'
import { Mail, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { BusinessInvitation } from '@/features/business-panel/services/businessUsers.service'
import { formatDate } from '@/shared/utils/date-formatter'

interface InvitationListRowProps {
  invitation: BusinessInvitation
  index: number
  onResend: () => void
  onRevoke: () => void
}

function InvitationListRow({ invitation, index, onResend, onRevoke }: InvitationListRowProps) {
  const { t, i18n } = useTranslation('business')
  const { accentColor, cardBg, textColor } = useBusinessPanelTheme()

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="flex items-center gap-4 p-4 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all group"
      style={{ backgroundColor: cardBg }}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 flex-shrink-0">
        <Mail className="w-5 h-5 opacity-60" style={{ color: accentColor }} />
      </div>

      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
        <div className="col-span-1 lg:col-span-2 min-w-0">
          <div className="font-semibold text-sm truncate" style={{ color: textColor }}>
            {invitation.email}
          </div>
          <div className="text-xs opacity-40 uppercase font-bold tracking-wider">{invitation.role}</div>
        </div>

        <div className="hidden lg:block text-xs opacity-60">
          {t('users.card.sent')}: {formatDate(invitation.created_at, i18n.language)}
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/10">
            {t('users.status.pending', 'Pendiente')}
          </span>
          <span className="text-[10px] opacity-40 whitespace-nowrap">
            {t('users.card.expires')}: {formatDate(invitation.expires_at, i18n.language)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={onResend}
          className="p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 text-amber-500 transition-colors"
          title={t('users.card.resendInvite')}
        >
          <Mail className="w-4 h-4" />
        </button>
        <button
          onClick={onRevoke}
          className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-red-500 transition-colors"
          title={t('users.card.revoke')}
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

export { InvitationListRow }
export type { InvitationListRowProps }
