'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { AdminPrompt } from '../services/adminPrompts.service'

interface DeletePromptModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (prompt: AdminPrompt) => Promise<void>
  prompt: AdminPrompt | null
  isDeleting?: boolean
}

export function DeletePromptModal({
  isOpen,
  onClose,
  onConfirm,
  prompt,
  isDeleting = false
}: DeletePromptModalProps) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')

  const handleConfirm = async () => {
    if (prompt) {
      await onConfirm(prompt)
    }
  }

  if (!prompt) {
    return null
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>

                <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
                  {t('prompts.deleteModal.title')}
                </Dialog.Title>

                <div className="text-center mb-6">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {t('prompts.deleteModal.confirmText')}
                  </p>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-left">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">{prompt.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{prompt.description}</p>

                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-500">
                      <span>Categoría: {prompt.category?.name || 'Sin categoría'}</span>
                      <span>Dificultad: {prompt.difficulty_level}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-500 mt-2">
                      <span>Vistas: {prompt.view_count}</span>
                      <span>Likes: {prompt.like_count}</span>
                    </div>
                  </div>

                  <p className="text-red-600 dark:text-red-400 text-sm mt-4">
                    ⚠️ {t('generic.irreversible')}
                  </p>
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isDeleting}
                    className="px-6 py-3 text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {tc('actions.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isDeleting}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {tc('actions.deleting')}
                      </>
                    ) : (
                      tc('actions.delete')
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
