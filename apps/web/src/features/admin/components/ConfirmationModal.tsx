'use client'

import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { AdminButton, AdminModalShell } from './ui'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'success' | 'danger'
  isLoading?: boolean
}

function getModalIcon(type: ConfirmationModalProps['type']) {
  switch (type) {
    case 'success':
      return CheckCircleIcon
    case 'danger':
      return XCircleIcon
    default:
      return ExclamationTriangleIcon
  }
}

function getConfirmVariant(type: ConfirmationModalProps['type']) {
  switch (type) {
    case 'success':
      return 'success' as const
    case 'danger':
      return 'danger' as const
    default:
      return 'primary' as const
  }
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = 'warning',
  isLoading = false,
}: ConfirmationModalProps) {
  const { t } = useTranslation('common')
  const resolvedConfirmText = confirmText ?? t('actions.confirm')
  const resolvedCancelText = cancelText ?? t('actions.cancel')
  const Icon = getModalIcon(type)

  return (
    <AdminModalShell
      isOpen={isOpen}
      onClose={onClose}
      icon={Icon}
      title={title}
      description={message}
      className="max-w-md"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AdminButton onClick={onClose} variant="secondary" disabled={isLoading}>
            {resolvedCancelText}
          </AdminButton>
          <AdminButton
            onClick={onConfirm}
            variant={getConfirmVariant(type)}
            disabled={isLoading}
          >
            {isLoading ? t('actions.loading') : resolvedConfirmText}
          </AdminButton>
        </div>
      }
    >
      <div />
    </AdminModalShell>
  )
}
