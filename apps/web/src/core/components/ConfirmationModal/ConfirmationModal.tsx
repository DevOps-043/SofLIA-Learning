'use client'

import React, { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

export interface ConfirmationModalProps {
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
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning',
  isLoading = false
}: ConfirmationModalProps) {
  const getIconAndColors = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircleIcon,
          iconColor: 'text-green-600 dark:text-green-400',
          iconBg: 'bg-green-100 dark:bg-green-900/30',
          confirmBg: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
          borderColor: 'border-green-200 dark:border-green-800'
        }
      case 'danger':
        return {
          icon: XCircleIcon,
          iconColor: 'text-red-600 dark:text-red-400',
          iconBg: 'bg-red-100 dark:bg-red-900/30',
          confirmBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          borderColor: 'border-red-200 dark:border-red-800'
        }
      default:
        return {
          icon: ExclamationTriangleIcon,
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
          confirmBg: 'bg-[#00D4B3] hover:bg-[#00D4B3]/80 focus:ring-[#00D4B3]', // Usar color de SofLIA por defecto
          borderColor: 'border-yellow-200 dark:border-yellow-800'
        }
    }
  }

  const { icon: Icon, iconColor, iconBg, confirmBg, borderColor } = getIconAndColors()

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all border border-gray-200 dark:border-gray-700">
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full ${iconBg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900 dark:text-white">
                      {title}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {message}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white focus:outline-none transition-colors"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    className={`inline-flex justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white focus:outline-none transition-colors shadow-lg ${confirmBg}`}
                    onClick={onConfirm}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Procesando...
                      </div>
                    ) : (
                      confirmText
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
