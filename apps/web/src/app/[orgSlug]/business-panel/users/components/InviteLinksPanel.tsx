'use client'

import { motion } from 'framer-motion'
import { Link2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { InviteLinkCard } from './InviteLinkCard'
import { InviteLinkRow } from './InviteLinkRow'
import { ManagementTabEmptyState } from './ManagementTabEmptyState'
import styles from './UsersPanel.module.css'
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
        description="Los enlaces compartidos aparecerán aquí con su vigencia y uso disponible."
      />
    )
  }

  if (logic.viewMode === 'cards') {
    return (
      <motion.div animate={{ opacity: 1 }} className={styles.cardGrid} exit={{ opacity: 0 }} initial={{ opacity: 0 }} key="grid-links">
        {logic.filteredInviteLinks.map((link, index) => (
          <InviteLinkCard
            index={index}
            key={link.id}
            link={link}
            onDelete={() => logic.deleteInviteLink(link.id)}
            onToggleStatus={() => toggleLink(logic, link)}
          />
        ))}
      </motion.div>
    )
  }

  return (
    <motion.div animate={{ opacity: 1 }} className={styles.managementList} exit={{ opacity: 0 }} initial={{ opacity: 0 }} key="list-links">
      <div className={`${styles.managementListHeader} ${styles.linkListHeader}`}>
        <span>{t('users.list.link', 'Enlace')}</span>
        <span>{t('users.list.usage', 'Uso')}</span>
        <span>{t('users.list.expires', 'Vencimiento')}</span>
        <span>{t('users.list.status', 'Estado')}</span>
        <span>Acciones</span>
      </div>
      {logic.filteredInviteLinks.map((link, index) => (
        <InviteLinkRow
          index={index}
          key={link.id}
          link={link}
          onDelete={() => logic.deleteInviteLink(link.id)}
          onToggleStatus={() => toggleLink(logic, link)}
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
