'use client'

import { motion } from 'framer-motion'
import { Link2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { InviteLinkCard } from './InviteLinkCard'
import { InviteLinkRow } from './InviteLinkRow'
import { ManagementTabEmptyState } from './ManagementTabEmptyState'
import type { BusinessUsersPageLogic, BusinessUsersTheme } from './users-page.types'

interface InviteLinksPanelProps {
  logic: BusinessUsersPageLogic
  theme: BusinessUsersTheme
}

export function InviteLinksPanel({ logic, theme }: InviteLinksPanelProps) {
  const { t } = useTranslation('business')

  if (logic.filteredInviteLinks.length === 0) {
    return (
      <ManagementTabEmptyState
        key="empty-links"
        theme={theme}
        icon={<Link2 className="h-16 w-16" />}
        title="No hay enlaces activos"
        description="Crea enlaces de invitacion masiva para compartir con grupos grandes."
      />
    )
  }

  if (logic.viewMode === 'cards') {
    return (
      <motion.div key="grid-links" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {logic.filteredInviteLinks.map((link, index) => (
          <InviteLinkCard
            key={link.id}
            link={link}
            index={index}
            onToggleStatus={() => toggleLink(logic, link)}
            onDelete={() => logic.deleteInviteLink(link.id)}
          />
        ))}
      </motion.div>
    )
  }

  return (
    <motion.div key="list-links" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
      <div className="hidden grid-cols-5 gap-4 px-4 py-2 text-xs font-medium uppercase tracking-wider opacity-50 lg:grid">
        <div>{t('users.list.link', 'Enlace')}</div>
        <div>{t('users.list.usage', 'Uso / Disponibles')}</div>
        <div>{t('users.list.expires', 'Vencimiento')}</div>
        <div className="text-right">Acciones</div>
      </div>
      {logic.filteredInviteLinks.map((link, index) => (
        <InviteLinkRow
          key={link.id}
          link={link}
          index={index}
          onToggleStatus={() => toggleLink(logic, link)}
          onDelete={() => logic.deleteInviteLink(link.id)}
        />
      ))}
    </motion.div>
  )
}

function toggleLink(
  logic: BusinessUsersPageLogic,
  link: BusinessUsersPageLogic['filteredInviteLinks'][number],
) {
  logic.updateInviteLinkStatus(link.id, link.status === 'active' ? 'pause' : 'resume')
}
