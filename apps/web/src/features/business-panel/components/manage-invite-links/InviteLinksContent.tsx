'use client'

import type { ManageInviteLinksState } from './invite-links.types'
import { InviteLinkCard } from './InviteLinkCard'
import { InviteLinksEmptyState } from './InviteLinksEmptyState'
import { InviteLinksErrorAlert } from './InviteLinksErrorAlert'
import { InviteLinksLoadingList } from './InviteLinksLoadingList'

export function InviteLinksContent({
  onCreateNew,
  state,
}: {
  onCreateNew: () => void
  state: ManageInviteLinksState
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <InviteLinksErrorAlert error={state.error} onDismiss={() => state.setError(null)} />
      {state.isLoading ? (
        <InviteLinksLoadingList />
      ) : state.links.length === 0 ? (
        <InviteLinksEmptyState onCreateNew={onCreateNew} />
      ) : (
        <div className="space-y-3">
          {state.links.map(link => <InviteLinkCard key={link.id} link={link} state={state} />)}
        </div>
      )}
    </div>
  )
}
