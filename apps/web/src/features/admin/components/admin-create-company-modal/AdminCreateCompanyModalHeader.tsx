'use client'

import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface AdminCreateCompanyModalHeaderProps {
  accentColor: string
  onClose: () => void
}

export function AdminCreateCompanyModalHeader({
  accentColor,
  onClose,
}: AdminCreateCompanyModalHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-8 py-6 dark:border-white/5">
      <div>
        <div className="mb-1 flex items-center gap-3">
          <div className="rounded-lg p-2" style={{ backgroundColor: `${accentColor}20` }}>
            <PlusIcon className="h-5 w-5" style={{ color: accentColor }} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Nueva Organización
          </h2>
        </div>
        <p className="ml-12 text-sm text-gray-500 dark:text-gray-400">
          Crea una nueva empresa en la plataforma SOFLIA
        </p>
      </div>
      <button
        onClick={onClose}
        className="rounded-xl p-2.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/5 dark:hover:text-white"
      >
        <XMarkIcon className="h-6 w-6" />
      </button>
    </div>
  )
}
