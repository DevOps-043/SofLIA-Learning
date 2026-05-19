'use client'

import { motion } from 'framer-motion'
import { Mail, XCircle, Activity, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { BusinessInvitation } from '@/features/business-panel/services/businessUsers.service'
import { formatDate } from '@/shared/utils/date-formatter'

interface InvitationCardProps {
  invitation: BusinessInvitation
  index: number
  onResend: () => void
  onRevoke: () => void
}

function InvitationCard({ invitation, index, onResend, onRevoke }: InvitationCardProps) {
  const { t, i18n } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      whileHover={{ y: -6 }}
      className="group relative flex flex-col rounded-3xl border transition-all duration-300 overflow-hidden"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
        backdropFilter: 'blur(20px)',
        boxShadow: theme.isDark
          ? '0 20px 40px -20px rgba(0,0,0,0.5)'
          : '0 10px 20px -10px rgba(0,0,0,0.05)',
      }}
    >
      {/* Header */}
      <div className="relative h-24 flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 blur-2xl"
          style={{ background: `radial-gradient(circle, ${theme.accentColor} 0%, transparent 70%)` }}
        />
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center border-2 shadow-2xl relative z-10"
          style={{
            backgroundColor: theme.inputBg,
            borderColor: theme.borderColor,
            color: theme.accentColor,
          }}
        >
          <Mail className="w-7 h-7" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 pt-0">
        <div className="text-center mb-4">
          <h4 className="font-bold text-base tracking-tight truncate mb-0.5" style={{ color: theme.textColor }}>
            {invitation.email}
          </h4>
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
            style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: theme.statusColors.invited }}
          >
            <Activity className="w-2.5 h-2.5 animate-pulse" />
            {t('users.status.pending', 'Pendiente')}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mb-4">
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-40">
              {t('users.modals.delete.fields.role')}
            </span>
            <span className="text-[9px] font-bold uppercase" style={{ color: theme.accentColor }}>
              {invitation.role}
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-40">
              {t('users.card.expires')}
            </span>
            <span className="text-[9px] font-bold" style={{ color: theme.subtextColor }}>
              {formatDate(invitation.expires_at, i18n.language)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto grid grid-cols-2 gap-1.5">
          <button
            onClick={onResend}
            className="col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
            style={{
              backgroundColor: theme.accentColor,
              color: theme.isDark ? 'var(--color-black)' : 'var(--color-bg-light)',
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t('users.card.resendInvite')}
          </button>
          <button
            onClick={onRevoke}
            className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-colors hover:bg-red-500/10 border border-red-500/10 font-bold text-[9px] uppercase tracking-widest"
            style={{ color: theme.dangerColor }}
          >
            <XCircle className="w-3 h-3" />
            {t('users.card.revoke')}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export { InvitationCard }
export type { InvitationCardProps }
