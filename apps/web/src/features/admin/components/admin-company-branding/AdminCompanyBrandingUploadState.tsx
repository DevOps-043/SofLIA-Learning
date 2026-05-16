'use client'

import { ArrowPathIcon } from '@heroicons/react/24/outline'

export function AdminCompanyBrandingUploadState() {
  return (
    <div className="flex flex-col items-center gap-3">
      <ArrowPathIcon className="h-8 w-8 animate-spin text-accent" />
      <p className="text-xs font-medium text-accent">Subiendo...</p>
    </div>
  )
}
