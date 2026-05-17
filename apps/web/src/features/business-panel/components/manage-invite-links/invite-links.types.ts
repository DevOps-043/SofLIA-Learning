import type { RefObject } from 'react'

export interface BulkInviteLink {
  id: string
  token: string
  name: string | null
  max_uses: number
  current_uses: number
  role: string
  expires_at: string
  status: 'active' | 'paused' | 'expired' | 'exhausted'
  created_at: string
}

export interface BusinessManageInviteLinksModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateNew: () => void
  organizationSlug?: string
}

export type InviteLinkAction = 'pause' | 'resume' | 'delete'

export interface ManageInviteLinksState {
  actionLoading: string | null
  copiedId: string | null
  error: string | null
  fetchLinks: () => Promise<void>
  getInviteUrl: (token: string) => string
  handleAction: (linkId: string, action: InviteLinkAction) => Promise<void>
  handleCopy: (link: BulkInviteLink) => Promise<void>
  isLoading: boolean
  links: BulkInviteLink[]
  menuRef: RefObject<HTMLDivElement>
  openMenuId: string | null
  setError: (error: string | null) => void
  setOpenMenuId: (id: string | null) => void
}
