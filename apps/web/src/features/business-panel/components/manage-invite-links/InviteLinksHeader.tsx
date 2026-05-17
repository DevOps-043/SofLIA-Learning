'use client'

import { Link2, RefreshCw, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useInviteLinksTheme } from './useInviteLinksTheme'

interface InviteLinksHeaderProps {
  isLoading: boolean
  onClose: () => void
  onRefresh: () => void | Promise<void>
}

export function InviteLinksHeader({ isLoading, onClose, onRefresh }: InviteLinksHeaderProps) {
  const { t } = useTranslation('business')
  const theme = useInviteLinksTheme()

  return (
    <div className="p-6 border-b shrink-0" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}20, ${theme.accentColor}10)`, borderColor: theme.borderColor }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ backgroundColor: `${theme.accentColor}20` }}>
            <Link2 className="w-6 h-6" style={{ color: theme.accentColor }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: theme.textColor }}>{t('users.modals.manageLinks.title', 'Enlaces de Invitacion')}</h3>
            <p className="text-sm" style={{ color: theme.mutedText }}>{t('users.modals.manageLinks.subtitle', 'Administra los enlaces de invitacion masiva')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void onRefresh()} disabled={isLoading} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50" title={t('common.refresh', 'Actualizar')}>
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} style={{ color: theme.mutedText }} />
          </button>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" style={{ color: theme.mutedText }} />
          </button>
        </div>
      </div>
    </div>
  )
}
