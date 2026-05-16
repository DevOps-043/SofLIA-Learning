'use client'

import { ArrowPathIcon } from '@heroicons/react/24/outline'

export function EditCompanyLoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#0A0D12]">
      <div className="text-center">
        <ArrowPathIcon className="mx-auto h-8 w-8 animate-spin text-[#0A2540] dark:text-[#00D4B3]" />
        <p className="mt-4 text-gray-500 dark:text-white/70">Cargando empresa...</p>
      </div>
    </div>
  )
}
