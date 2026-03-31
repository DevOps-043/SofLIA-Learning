'use client'

import { motion } from 'framer-motion'
import { Link2, Pause, Play, Trash2, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/core/stores/themeStore'
import { BulkInviteLink } from '@/features/business-panel/services/businessUsers.service'

// ============================================
// COMPONENTE: InviteLinkRow
// ============================================
interface InviteLinkRowProps {
  link: BulkInviteLink
  index: number
  primaryColor: string
  onToggleStatus: () => void
  onDelete: () => void
}

function InviteLinkRow({ link, index, primaryColor, onToggleStatus, onDelete }: InviteLinkRowProps) {
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const remainingSlots = link.max_uses - link.current_uses

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="flex items-center gap-4 p-4 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all group"
      style={{ backgroundColor: isDark ? 'var(--org-card-background, #1E2329)' : '#FFFFFF' }}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 flex-shrink-0">
        <Link2 className="w-5 h-5 opacity-60" style={{ color: primaryColor }} />
      </div>

      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
        <div className="col-span-1 lg:col-span-1 min-w-0">
          <div className="font-semibold text-sm truncate" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
            {link.name || `Link ${link.token.substring(0, 6)}`}
          </div>
          <div className="text-[10px] opacity-40 uppercase font-bold tracking-wider">{link.role}</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-[10px] opacity-40 uppercase mb-0.5">Usos</p>
            <p className="text-sm font-bold" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>{link.current_uses}/{link.max_uses}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] opacity-40 uppercase mb-0.5">Libres</p>
            <p className="text-sm font-bold" style={{ color: remainingSlots > 0 ? primaryColor : '#EF4444' }}>{remainingSlots}</p>
          </div>
        </div>

        <div className="hidden lg:block text-[10px] opacity-40">
          Expira: {new Date(link.expires_at).toLocaleDateString()}
        </div>

        <div className="flex items-center justify-end gap-2">
          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
            link.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
            link.status === 'paused' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
          }`}>
            {link.status}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={onToggleStatus}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white/5' : 'bg-black/5'}`}
        >
          {link.status === 'active' ? <Pause className="w-4 h-4 text-amber-500" /> : <Play className="w-4 h-4 text-emerald-500" />}
        </button>
        <button
          onClick={onDelete}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white/5' : 'bg-black/5'} hover:bg-red-500/20`}
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>
    </motion.div>
  )
}

export { InviteLinkRow }
export type { InviteLinkRowProps }
