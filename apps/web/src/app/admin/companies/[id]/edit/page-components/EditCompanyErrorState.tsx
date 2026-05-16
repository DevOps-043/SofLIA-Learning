'use client'

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export function EditCompanyErrorState({
  error,
  onBack,
}: {
  error: string
  onBack: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#0A0D12]">
      <div className="text-center">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
        <p className="mt-4 text-gray-900 dark:text-white">{error}</p>
        <button
          onClick={onBack}
          className="mt-4 rounded-xl bg-[#0A2540] px-4 py-2 text-sm font-medium text-white dark:bg-[#00D4B3] dark:text-[#0A2540]"
        >
          Volver a empresas
        </button>
      </div>
    </div>
  )
}
