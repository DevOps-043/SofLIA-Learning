'use client'

import { AnimatePresence } from 'framer-motion'

import { InvitationsPanel } from './InvitationsPanel'
import { InviteLinksPanel } from './InviteLinksPanel'
import { JoinRequestsPanel } from './JoinRequestsPanel'
import { UsersListPanel } from './UsersListPanel'
import type { BusinessUsersPageLogic, BusinessUsersTheme } from './users-page.types'

interface UsersTabContentProps {
  logic: BusinessUsersPageLogic
  theme: BusinessUsersTheme
}

export function UsersTabContent({ logic, theme }: UsersTabContentProps) {
  return (
    <div id="tour-users-list">
      <AnimatePresence mode="wait">
        {logic.activeTab === 'users' ? (
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
