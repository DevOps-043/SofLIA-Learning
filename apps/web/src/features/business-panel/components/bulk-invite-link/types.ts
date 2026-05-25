import type { TFunction } from 'i18next'

export type ModalStatus = 'idle' | 'loading' | 'success' | 'error'
export type InviteRole = 'owner' | 'admin' | 'member'

export interface BulkInviteFormData {
  name: string
  maxUses: number
  role: InviteRole
  expiresAt: string
}

export interface CreatedLink {
  id: string
  token: string
  name: string | null
  max_uses: number
  role: string
  expires_at: string
}

export interface RoleLabel {
  label: string
  desc: string
}

export type RoleLabels = Record<InviteRole, RoleLabel>
export type BusinessTranslator = TFunction<'business'>
