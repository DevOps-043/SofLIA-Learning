'use client'

import { ArrowPathIcon } from '@heroicons/react/24/outline'

export function EditCompanyLoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-carbon-950">
      <div className="text-center">
        <ArrowPathIcon className="mx-auto h-8 w-8 animate-spin text-primary dark:text-accent" />
        <p className="mt-4 text-gray-500 dark:text-white/70">Cargando empresa...</p>
      </div>
    </div>
  )
}
