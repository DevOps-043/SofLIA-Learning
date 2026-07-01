'use client'

import { ArrowPathIcon } from '@heroicons/react/24/outline'

export function EditCompanyLoadingState() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <ArrowPathIcon className="mx-auto h-8 w-8 animate-spin text-primary dark:text-accent" />
        <p className="mt-4 text-sm text-gray-500 dark:text-white/50">Cargando empresa...</p>
      </div>
    </div>
  )
}
