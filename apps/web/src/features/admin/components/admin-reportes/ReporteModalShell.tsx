'use client'

import type { ReactNode } from 'react'
import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

interface ReporteModalShellProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  maxWidth?: string
  className?: string
}

export function ReporteModalShell({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-6xl',
  className = '',
}: ReporteModalShellProps) {
  const theme = useAdminPanelTheme()

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 backdrop-blur-sm" style={{ backgroundColor: theme.overlayBg }} />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel
                className={`w-full transform overflow-hidden rounded-[28px] border shadow-2xl transition-all ${maxWidth} ${className}`}
                style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
              >
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
