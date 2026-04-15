'use client'

import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { AdminApp } from '../services/adminApps.service'

interface DeleteAppModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (app: AdminApp) => Promise<void>
  app: AdminApp | null
  isDeleting?: boolean
}

export function DeleteAppModal({ isOpen, onClose, onConfirm, app, isDeleting = false }: DeleteAppModalProps) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')

  const handleConfirm = async () => {
    if (app) {
      await onConfirm(app)
    }
  }

  if (!isOpen || !app) return null

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-gray-600/75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('apps.deleteModal.title')}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {t('apps.deleteModal.confirmText')}
              </h3>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <h4 className="text-gray-900 dark:text-white font-medium mb-2">{app.name}</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{app.description}</p>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-500">
              <span className="mr-4">Categoría: {app.ai_categories?.name || 'Sin categoría'}</span>
              <span>Modelo: {app.pricing_model}</span>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400 text-sm">
              {t('generic.irreversible')}
            </p>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {tc('actions.cancel')}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isDeleting ? tc('actions.deleting') : tc('actions.delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
