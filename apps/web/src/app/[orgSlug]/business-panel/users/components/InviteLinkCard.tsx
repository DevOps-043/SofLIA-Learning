'use client'

import { motion } from 'framer-motion'
import { Link2, Pause, Play, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { BulkInviteLink } from '@/features/business-panel/services/businessUsers.service'

interface InviteLinkCardProps {
  link: BulkInviteLink
  index: number
  onToggleStatus: () => void
  onDelete: () => void
}

function InviteLinkCard({ link, index, onToggleStatus, onDelete }: InviteLinkCardProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  const getLinkStatusConfig = (status: string) => {
    switch (status) {
      case 'active':  return { label: 'Activo',   color: theme.statusColors.active,    bg: 'rgba(0,212,179,0.1)' }
      case 'paused':  return { label: 'Pausado',  color: theme.statusColors.invited,   bg: 'rgba(245,158,11,0.1)' }
      case 'expired': return { label: 'Expirado', color: theme.statusColors.suspended, bg: 'rgba(239,68,68,0.1)' }
      default:        return { label: status,     color: theme.subtextColor,           bg: 'rgba(0,0,0,0.05)' }
    }
  }

  const statusConfig = getLinkStatusConfig(link.status)
  const usagePercent = Math.min(100, (link.current_uses / link.max_uses) * 100)

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
          <Link2 className="w-7 h-7" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 pt-0">
        <div className="text-center mb-4">
          <h4 className="font-bold text-base tracking-tight truncate mb-0.5" style={{ color: theme.textColor }}>
            {link.name || `Enlace ${link.token.substring(0, 6)}`}
          </h4>
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
            style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
          >
            {statusConfig.label}
          </div>
        </div>

        {/* Usage */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-black uppercase tracking-tight opacity-40">Uso</span>
            <span className="text-[10px] font-bold" style={{ color: theme.textColor }}>
              {link.current_uses} / {link.max_uses}
            </span>
          </div>
          <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden mb-1.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${usagePercent}%` }}
              className="h-full rounded-full"
              style={{ backgroundColor: theme.accentColor }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold opacity-40 lowercase">{usagePercent.toFixed(0)}%</span>
            <span className="text-[9px] font-black uppercase tracking-tight opacity-40">Rol: {link.role}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto grid grid-cols-2 gap-1.5">
          <button
            onClick={onToggleStatus}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-300 font-bold text-[10px] uppercase tracking-widest border border-white/5"
            style={{
              backgroundColor: link.status === 'active'
                ? `${theme.statusColors.invited}10`
                : `${theme.accentColor}10`,
              color: link.status === 'active'
                ? theme.statusColors.invited
                : theme.accentColor,
            }}
          >
            {link.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {t(link.status === 'active' ? 'inviteLinks.pause' : 'inviteLinks.resume', 'Status')}
          </button>

          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-colors hover:bg-red-500/10 border border-red-500/10 font-bold text-[10px] uppercase tracking-widest"
            style={{ color: theme.dangerColor }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t('common.delete', 'Borrar')}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export { InviteLinkCard }
export type { InviteLinkCardProps }
