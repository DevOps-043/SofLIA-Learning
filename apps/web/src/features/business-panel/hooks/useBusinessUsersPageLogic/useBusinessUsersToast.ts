import { useState } from 'react'
import type { ToastType } from '@/core/components/ToastNotification/ToastNotification'
import type { BusinessUsersToastState } from './types'

export function useBusinessUsersToast() {
  const [toast, setToast] = useState<BusinessUsersToastState>({
    isOpen: false,
    message: '',
    type: 'success',
  })
  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ isOpen: true, message, type })
  }

  return { toast, setToast, showToast }
}
