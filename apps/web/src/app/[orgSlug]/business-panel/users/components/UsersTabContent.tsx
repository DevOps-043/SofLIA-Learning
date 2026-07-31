'use client'

import { AnimatePresence } from 'framer-motion'

import { InvitationsPanel } from './InvitationsPanel'
import { InviteLinksPanel } from './InviteLinksPanel'
import { JoinRequestsPanel } from './JoinRequestsPanel'
import { UsersListPanel } from './UsersListPanel'
import { UsersTabSkeleton } from './UsersTabSkeleton'
import styles from './UsersPanel.module.css'
import type { BusinessUsersPageLogic, BusinessUsersTheme } from './users-page.types'

interface UsersTabContentProps {
  logic: BusinessUsersPageLogic
  theme: BusinessUsersTheme
  isLoading?: boolean
}

export function UsersTabContent({ logic, theme, isLoading = false }: UsersTabContentProps) {
  // Las solicitudes vienen de otro origen (`useJoinRequests`) y no participan en
  // la carga del recurso activo, así que no deben mostrar su esqueleto.
  const isReloadingResource = isLoading && logic.activeTab !== 'requests'

  return (
    <div id="tour-users-list" className={styles.contentRegion}>
      <AnimatePresence mode="wait">
        {isReloadingResource ? (
          <UsersTabSkeleton key="skeleton" viewMode={logic.viewMode} />
        ) : logic.activeTab === 'users' ? (
          <UsersListPanel logic={logic} />
        ) : logic.activeTab === 'invitations' ? (
          <InvitationsPanel logic={logic} theme={theme} />
        ) : logic.activeTab === 'links' ? (
          <InviteLinksPanel logic={logic} theme={theme} />
        ) : (
          <JoinRequestsPanel logic={logic} theme={theme} />
        )}
      </AnimatePresence>
    </div>
  )
}
