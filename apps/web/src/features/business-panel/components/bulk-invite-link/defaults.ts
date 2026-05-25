import type { BulkInviteFormData } from './types'

export const DEFAULT_FORM_DATA: BulkInviteFormData = {
  name: '',
  maxUses: 100,
  role: 'member',
  expiresAt: '',
}

export function getDefaultExpiresAt() {
  const defaultExpiry = new Date()
  defaultExpiry.setDate(defaultExpiry.getDate() + 7)
  return defaultExpiry.toISOString().slice(0, 16)
}
