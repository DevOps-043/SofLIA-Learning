'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Pause, Play, Trash2 } from 'lucide-react'
import type { ReactNode, RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import type { BulkInviteLink, InviteLinkAction } from './invite-links.types'
import { useInviteLinksTheme } from './useInviteLinksTheme'

interface InviteLinkActionMenuProps {
  link: BulkInviteLink
  menuRef: RefObject<HTMLDivElement>
  onAction: (linkId: string, action: InviteLinkAction) => Promise<void>
  openMenuId: string | null
}

export function InviteLinkActionMenu({ link, menuRef, onAction, openMenuId }: InviteLinkActionMenuProps) {
  const { t } = useTranslation('business')
  const theme = useInviteLinksTheme()

  return (
    <AnimatePresence>
      {openMenuId === link.id && (
        <motion.div ref={menuRef} initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} className="absolute right-0 top-full mt-1 w-40 rounded-xl border shadow-lg overflow-hidden" style={{ backgroundColor: theme.isDark ? '#252b3b' : '#FFFFFF', borderColor: theme.borderColor, zIndex: 50 }}>
          {link.status === 'active' && <MenuButton icon={<Pause className="w-4 h-4" style={{ color: '#F59E0B' }} />} label={t('users.modals.manageLinks.actions.pause', 'Pausar')} onClick={() => onAction(link.id, 'pause')} />}
          {link.status === 'paused' && <MenuButton icon={<Play className="w-4 h-4" style={{ color: '#22C55E' }} />} label={t('users.modals.manageLinks.actions.resume', 'Reanudar')} onClick={() => onAction(link.id, 'resume')} />}
          <button onClick={() => void onAction(link.id, 'delete')} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-red-500/10 transition-colors text-red-500">
            <Trash2 className="w-4 h-4" />
            {t('users.modals.manageLinks.actions.delete', 'Eliminar')}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function MenuButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void | Promise<void> }) {
  const theme = useInviteLinksTheme()
  return (
    <button onClick={() => void onClick()} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: theme.textColor }}>
      {icon}
      {label}
    </button>
  )
}
