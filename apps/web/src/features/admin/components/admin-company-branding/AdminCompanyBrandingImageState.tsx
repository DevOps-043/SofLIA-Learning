'use client'

import { CloudArrowUpIcon } from '@heroicons/react/24/outline'

interface AdminCompanyBrandingImageStateProps {
  actionLabel: string
  imageUrl: string
  objectFit: 'contain' | 'cover'
}

export function AdminCompanyBrandingImageState({
  actionLabel,
  imageUrl,
  objectFit,
}: AdminCompanyBrandingImageStateProps) {
  return (
    <>
      <img
        src={imageUrl}
        className={`relative z-10 h-full w-full ${objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
        alt={actionLabel}
      />
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/60 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
        <CloudArrowUpIcon className="h-8 w-8 text-white" />
        <p className="text-xs font-medium text-white">{actionLabel}</p>
      </div>
    </>
  )
}
