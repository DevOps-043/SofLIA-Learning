'use client'

import { useState } from 'react'
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { AdminUser } from '../services/adminUsers.service'

interface DeleteUserModalProps {
  user: AdminUser | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function DeleteUserModal({ user, isOpen, onClose, onConfirm }: DeleteUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')

  const handleConfirm = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.deleteModal.errorDeleting'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !user) return null

  const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-900/50 dark:bg-gray-600/75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('users.deleteModal.title')}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Warning Icon */}
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>

            {/* Warning Message */}
            <div className="text-center mb-6">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('users.deleteModal.confirmQuestion')}
              </h4>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {t('users.deleteModal.irreversible')}
              </p>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">@{user.username}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="text-left bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  <strong>{t('users.deleteModal.alsoDeleted')}</strong>
                </p>
                <ul className="text-sm text-yellow-600 dark:text-yellow-300 mt-1 space-y-1">
                  <li>• {t('users.deleteModal.sessions')}</li>
                  <li>• {t('users.deleteModal.favorites')}</li>
                  <li>• {t('users.deleteModal.associatedData')}</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                disabled={isLoading}
              >
                {tc('actions.cancel')}
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                disabled={isLoading}
              >
                <TrashIcon className="h-4 w-4" />
                <span>{isLoading ? tc('actions.deleting') : tc('actions.delete')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
