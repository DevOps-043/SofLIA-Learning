'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useThemeStore } from '@/core/stores/themeStore'
import { useTranslation } from 'react-i18next'

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

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = 'warning',
  isLoading = false
}: ConfirmationModalProps) {
  const { resolvedTheme } = useThemeStore()
  const { t } = useTranslation('common')
  const resolvedConfirmText = confirmText ?? t('actions.confirm')
  const resolvedCancelText = cancelText ?? t('actions.cancel')
  const isDark = resolvedTheme === 'dark'
  const actionColor = isDark ? 'var(--color-accent)' : 'var(--color-primary)'
  const onActionColor = isDark ? 'var(--color-legacy-04130f)' : 'var(--color-bg-light)'
  const actionSurface = isDark ? 'rgba(0,212,179,0.14)' : 'rgba(10,37,64,0.08)'

  const getIconAndColors = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircleIcon,
          iconColor: actionColor,
          iconBg: actionSurface,
          confirmBg: actionColor
        }
      case 'danger':
        return {
          icon: XCircleIcon,
          iconColor: isDark ? 'var(--color-legacy-fca5a5)' : 'var(--color-legacy-dc2626)',
          iconBg: isDark ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.08)',
          confirmBg: 'var(--color-legacy-dc2626)'
        }
      default:
        return {
          icon: ExclamationTriangleIcon,
          iconColor: isDark ? 'var(--color-legacy-fcd34d)' : 'var(--color-legacy-d97706)',
          iconBg: isDark ? 'rgba(245,158,11,0.18)' : 'rgba(245,158,11,0.08)',
          confirmBg: 'var(--color-legacy-d97706)'
        }
    }
  }

  const { icon: Icon, iconColor, iconBg, confirmBg } = getIconAndColors()

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
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-[100dvh] items-end justify-center p-0 text-center sm:items-center sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-t-3xl border border-gray-200 bg-white p-4 text-left align-middle shadow-xl transition-all dark:border-gray-700 dark:bg-gray-800 sm:rounded-2xl sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:space-x-4 sm:gap-0">
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: iconBg }}
                  >
                    <Icon className="w-6 h-6" style={{ color: iconColor }} />
                  </div>
                  <div className="flex-1">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                      {title}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {message}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:space-x-0">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white sm:w-auto"
                    style={{ ['--tw-ring-color' as string]: actionColor }}
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    {resolvedCancelText}
                  </button>
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto"
                    style={{
                      backgroundColor: confirmBg,
                      color: type === 'success' ? onActionColor : 'var(--color-bg-light)',
                      ['--tw-ring-color' as string]: confirmBg,
                    }}
                    onClick={onConfirm}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('actions.loading')}
                      </div>
                    ) : (
                      resolvedConfirmText
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
