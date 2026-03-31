'use client'

import { motion } from 'framer-motion'
import { Mail, XCircle, Activity, CheckCircle, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/core/stores/themeStore'
import { BusinessInvitation } from '@/features/business-panel/services/businessUsers.service'

// ============================================
// COMPONENTE: InvitationCard
// ============================================
interface InvitationCardProps {
  invitation: BusinessInvitation
  index: number
  primaryColor: string
  onResend: () => void
  onRevoke: () => void
}

function InvitationCard({ invitation, index, primaryColor, onResend, onRevoke }: InvitationCardProps) {
  const { t } = useTranslation('business')
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-2xl p-6 border border-white/10"
      style={{ backgroundColor: isDark ? 'var(--org-card-background, #1E2329)' : '#FFFFFF' }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 flex-shrink-0">
            <Mail className="w-6 h-6 opacity-60" style={{ color: primaryColor }} />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold truncate" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>{invitation.email}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-white/5 text-white/40 border border-white/5">
                {invitation.role}
              </span>
              <span className="text-[10px] text-white/40 flex items-center gap-1 whitespace-nowrap">
                <Activity className="w-3 h-3" />
                {new Date(invitation.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onResend}
            className="p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 text-amber-500 transition-colors"
            title="Reenviar"
          >
            <Mail className="w-4 h-4" />
          </button>
          <button
            onClick={onRevoke}
            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-red-500 transition-colors"
            title="Revocar"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="text-[10px] uppercase font-bold tracking-wider opacity-30 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {t('users.status.pending', 'Pendiente')}
        </div>
        <div className="text-[10px] opacity-40">
          Expira: {new Date(invitation.expires_at).toLocaleDateString()}
        </div>
      </div>
    </motion.div>
  )
}

export { InvitationCard }
export type { InvitationCardProps }
