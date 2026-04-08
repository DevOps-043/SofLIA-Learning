'use client'

import { motion } from 'framer-motion'
import { Link2, Pause, Play, Trash2, Calendar, Clock, CheckCircle, XCircle, Users, BarChart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/core/stores/themeStore'
import { BulkInviteLink } from '@/features/business-panel/services/businessUsers.service'

// ============================================
// COMPONENTE: InviteLinkCard (Vertical Aesthetic)
// ============================================
interface InviteLinkCardProps {
  link: BulkInviteLink
  index: number
  primaryColor: string
  accentColor?: string
  onToggleStatus: () => void
  onDelete: () => void
}

function InviteLinkCard({ 
  link, 
  index, 
  primaryColor, 
  accentColor, 
  onToggleStatus, 
  onDelete 
}: InviteLinkCardProps) {
  const { t } = useTranslation('business')
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  const activeAccent = isDark ? (accentColor || '#00D4B3') : (primaryColor || '#0A2540')
  const cardBg = isDark ? 'rgba(30, 35, 41, 0.4)' : '#FFFFFF'
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)'
  const textColor = isDark ? '#FFFFFF' : '#0F172A'
  const subTextColor = isDark ? '#858E9B' : '#475569'

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active': return { label: 'Activo', color: '#00D4B3', bg: 'rgba(0,212,179,0.1)' }
      case 'paused': return { label: 'Pausado', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' }
      case 'expired': return { label: 'Expirado', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' }
      default: return { label: status, color: subTextColor, bg: 'rgba(0,0,0,0.05)' }
    }
  }

  const statusConfig = getStatusConfig(link.status)
  const usagePercent = Math.min(100, (link.current_uses / link.max_uses) * 100)

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
          <Link2 className="w-7 h-7" />
        </div>
      </div>

      {/* 2. Content Info (Compact) */}
      <div className="flex-1 flex flex-col p-4 pt-0">
        <div className="text-center mb-4">
          <h4 className="font-bold text-base tracking-tight truncate mb-0.5" style={{ color: textColor }}>
            {link.name || `Enlace ${link.token.substring(0, 6)}`}
          </h4>
          <div 
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
            style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
          >
            {statusConfig.label}
          </div>
        </div>

        {/* Usage Stats (Compact) */}
        <div className="mb-4">
           <div className="flex items-center justify-between mb-1.5 line-clamp-1">
              <span className="text-[9px] font-black uppercase tracking-tight opacity-40">Uso</span>
              <span className="text-[10px] font-bold" style={{ color: textColor }}>{link.current_uses} / {link.max_uses}</span>
           </div>
           {/* Progress Bar */}
           <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden mb-1.5">
              <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${usagePercent}%` }}
                 className="h-full rounded-full"
                 style={{ backgroundColor: activeAccent }}
              />
           </div>
           <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold opacity-40 lowercase">{usagePercent.toFixed(0)}%</span>
              <span className="text-[9px] font-black uppercase tracking-tight opacity-40">Rol: {link.role}</span>
           </div>
        </div>

        {/* 3. Actions (Compact) */}
        <div className="mt-auto grid grid-cols-2 gap-1.5">
           <button
             onClick={onToggleStatus}
             className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-300 font-bold text-[10px] uppercase tracking-widest border border-white/5"
             style={{ 
               backgroundColor: link.status === 'active' ? 'rgba(245,158,11,0.05)' : 'rgba(0,212,179,0.05)',
               color: link.status === 'active' ? '#F59E0B' : '#00D4B3'
             }}
           >
             {link.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
             Status
           </button>

           <button
             onClick={onDelete}
             className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-colors hover:bg-red-500/10 border border-red-500/10 text-red-500 font-bold text-[10px] uppercase tracking-widest"
           >
             <Trash2 className="w-3.5 h-3.5" />
             Borrar
           </button>
        </div>
      </div>
    </motion.div>
  )
}

export { InviteLinkCard }
export type { InviteLinkCardProps }


