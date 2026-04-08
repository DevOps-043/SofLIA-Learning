'use client'

import { motion } from 'framer-motion'
import { Mail, XCircle, Activity, Calendar, RefreshCw, Clock, MoreHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/core/stores/themeStore'
import { BusinessInvitation } from '@/features/business-panel/services/businessUsers.service'

// ============================================
// COMPONENTE: InvitationCard (Vertical Aesthetic)
// ============================================
interface InvitationCardProps {
  invitation: BusinessInvitation
  index: number
  primaryColor: string
  accentColor?: string
  onResend: () => void
  onRevoke: () => void
}

function InvitationCard({ 
  invitation, 
  index, 
  primaryColor, 
  accentColor, 
  onResend, 
  onRevoke 
}: InvitationCardProps) {
  const { t } = useTranslation('business')
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  const activeAccent = isDark ? (accentColor || '#00D4B3') : (primaryColor || '#0A2540')
  const cardBg = isDark ? 'rgba(30, 35, 41, 0.4)' : '#FFFFFF'
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)'
  const textColor = isDark ? '#FFFFFF' : '#0F172A'
  const subTextColor = isDark ? '#858E9B' : '#475569'

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      whileHover={{ y: -6 }}
      className="group relative flex flex-col rounded-3xl border transition-all duration-300 overflow-hidden"
      style={{
        backgroundColor: cardBg,
        borderColor: borderColor,
        backdropFilter: 'blur(20px)',
        boxShadow: isDark ? '0 20px 40px -20px rgba(0,0,0,0.5)' : '0 10px 20px -10px rgba(0,0,0,0.05)'
      }}
    >
      {/* 1. Header Icon Section (Compact) */}
      <div className="relative h-24 flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10 blur-2xl"
          style={{ background: `radial-gradient(circle, ${activeAccent} 0%, transparent 70%)` }}
        />
        <div 
          className="w-14 h-14 rounded-xl flex items-center justify-center border-2 shadow-2xl relative z-10" 
          style={{ 
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
            borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            color: activeAccent
          }}
        >
          <Mail className="w-7 h-7" />
        </div>
      </div>

      {/* 2. Content Info Section (Compact) */}
      <div className="flex-1 flex flex-col p-4 pt-0">
        <div className="text-center mb-4">
           <h4 className="font-bold text-base tracking-tight truncate mb-0.5" style={{ color: textColor }}>{invitation.email}</h4>
           <div 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
              style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}
            >
              <Activity className="w-2.5 h-2.5 animate-pulse" />
              {t('users.status.pending', 'Pendiente')}
           </div>
        </div>

        {/* Roles Details (Compact) */}
        <div className="flex flex-col gap-1.5 mb-4">
           <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Rol</span>
              <span className="text-[9px] font-bold uppercase" style={{ color: activeAccent }}>{invitation.role}</span>
           </div>
           <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Expira</span>
              <span className="text-[9px] font-bold" style={{ color: subTextColor }}>{new Date(invitation.expires_at).toLocaleDateString()}</span>
           </div>
        </div>

        {/* 3. Actions (Compact) */}
        <div className="mt-auto grid grid-cols-2 gap-1.5">
           <button
              onClick={onResend}
              className="col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
              style={{ 
                 backgroundColor: activeAccent, 
                 color: activeAccent.toLowerCase() === '#00d4b3' ? '#000000' : '#FFFFFF' 
              }}
           >
              <RefreshCw className="w-3.5 h-3.5" />
              {t('common.resend', 'Reenviar')}
           </button>
           <button
              onClick={onRevoke}
              className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-colors hover:bg-red-500/10 border border-red-500/10 text-red-500 font-bold text-[9px] uppercase tracking-widest"
           >
              <XCircle className="w-3 h-3" />
              {t('common.revoke', 'Revocar')}
           </button>
        </div>
      </div>
    </motion.div>
  )
}

export { InvitationCard }
export type { InvitationCardProps }


