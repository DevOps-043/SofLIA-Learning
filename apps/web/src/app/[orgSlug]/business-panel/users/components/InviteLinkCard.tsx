'use client'

import { motion } from 'framer-motion'
import { Link2, Pause, Play, Trash2, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/core/stores/themeStore'
import { BulkInviteLink } from '@/features/business-panel/services/businessUsers.service'

// ============================================
// COMPONENTE: InviteLinkCard
// ============================================
interface InviteLinkCardProps {
  link: BulkInviteLink
  index: number
  primaryColor: string
  onToggleStatus: () => void
  onDelete: () => void
}

function InviteLinkCard({ link, index, primaryColor, onToggleStatus, onDelete }: InviteLinkCardProps) {
  const { t } = useTranslation('business')
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { text: '#10B981', bg: 'rgba(16,185,129,0.1)' }
      case 'paused': return { text: '#F59E0B', bg: 'rgba(245,158,11,0.1)' }
      case 'expired': return { text: '#EF4444', bg: 'rgba(239,68,68,0.1)' }
      case 'exhausted': return { text: '#6B7280', bg: 'rgba(107,114,128,0.1)' }
      default: return { text: primaryColor, bg: `${primaryColor}10` }
    }
  }

  const statusColors = getStatusColor(link.status)
  const remainingSlots = link.max_uses - link.current_uses

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="relative overflow-hidden rounded-2xl p-6 border border-white/10"
      style={{ backgroundColor: 'var(--org-card-background, #1E2329)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/10">
            <Link2 className="w-6 h-6 opacity-60" style={{ color: primaryColor }} />
          </div>
          <div>
            <h4 className="font-bold truncate max-w-[180px]" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
              {link.name || `Link ${link.token.substring(0, 6)}`}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold" style={{ backgroundColor: statusColors.bg, color: statusColors.text }}>
                {link.status}
              </span>
              <span className="text-[10px] opacity-40 uppercase font-bold">{link.role}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggleStatus}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white/5' : 'bg-black/5'}`}
            title={link.status === 'active' ? 'Pausar' : 'Activar'}
          >
            {link.status === 'active' ? <Pause className="w-4 h-4 text-amber-500" /> : <Play className="w-4 h-4 text-emerald-500" />}
          </button>
          <button
            onClick={onDelete}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white/5' : 'bg-black/5'} hover:bg-red-500/20 group`}
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4 text-red-500 group-hover:text-red-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-40 mb-1">Usos</p>
          <p className="text-xl font-black" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
            {link.current_uses} <span className="text-sm font-normal opacity-40">/ {link.max_uses}</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-40 mb-1">Espacios libres</p>
          <p className="text-xl font-black" style={{ color: remainingSlots > 0 ? primaryColor : '#EF4444' }}>
            {remainingSlots}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[10px] opacity-30">
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(link.created_at).toLocaleDateString()}</span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Expira: {new Date(link.expires_at).toLocaleDateString()}</span>
      </div>
    </motion.div>
  )
}

export { InviteLinkCard }
export type { InviteLinkCardProps }
