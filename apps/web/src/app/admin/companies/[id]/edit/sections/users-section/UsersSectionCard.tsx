'use client'

import { EnvelopeIcon, LinkIcon, PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Card, colors } from '../shared'
import type { CompanyUsersSubTab } from './types'
import { UsersToolbar } from './UsersToolbar'

const TAB_CONTENT = {
  members: {
    title: 'Miembros de la Empresa',
    description: 'usuarios encontrados',
    icon: UserGroupIcon,
    iconColor: colors.blue,
    actionLabel: 'Invitar usuario',
  },
  invitations: {
    title: 'Invitaciones Pendientes',
    description: 'invitaciones activas',
    icon: EnvelopeIcon,
    iconColor: colors.warning,
    actionLabel: 'Invitar usuario',
  },
  links: {
    title: 'Enlaces de Invitación Masiva',
    description: 'enlaces creados',
    icon: LinkIcon,
    iconColor: colors.purple,
    actionLabel: 'Crear enlace',
  },
} as const

export function UsersSectionCard({
  activeSubTab,
  count,
  roleFilter,
  searchTerm,
  children,
  onInvite,
  onRoleFilterChange,
  onSearchTermChange,
}: {
  activeSubTab: CompanyUsersSubTab
  count: number
  roleFilter: string
  searchTerm: string
  children: ReactNode
  onInvite: () => void
  onRoleFilterChange: (value: string) => void
  onSearchTermChange: (value: string) => void
}) {
  const content = TAB_CONTENT[activeSubTab]

  return (
    <Card
      title={content.title}
      description={`${count} ${content.description}`}
      icon={content.icon}
      iconColor={content.iconColor}
      actions={
        <motion.button
          onClick={onInvite}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: colors.accent, color: colors.primary }}
        >
          <PlusIcon className="h-4 w-4" />
          {content.actionLabel}
        </motion.button>
      }
    >
      <UsersToolbar
        activeSubTab={activeSubTab}
        roleFilter={roleFilter}
        searchTerm={searchTerm}
        onRoleFilterChange={onRoleFilterChange}
        onSearchTermChange={onSearchTermChange}
      />
      <div className="overflow-x-auto">{children}</div>
    </Card>
  )
}
