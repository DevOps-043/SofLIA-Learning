import type { ToastType } from '@/core/components/ToastNotification/ToastNotification'

export type BusinessUsersTab = 'users' | 'invitations' | 'links' | 'requests'
export type BusinessUsersResource = 'users' | 'invitations' | 'links'

export interface BusinessUsersToastState {
  isOpen: boolean
  message: string
  type: ToastType
}

export type ShowBusinessUsersToast = (
  message: string,
  type?: ToastType
) => void
