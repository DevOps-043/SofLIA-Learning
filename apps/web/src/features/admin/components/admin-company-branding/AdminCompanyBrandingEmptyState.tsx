'use client'

import type { ReactNode } from 'react'

interface AdminCompanyBrandingEmptyStateProps {
  emptyLabel: string
  emptyHint: string
  icon: ReactNode
}

export function AdminCompanyBrandingEmptyState({
  emptyLabel,
  emptyHint,
  icon,
}: AdminCompanyBrandingEmptyStateProps) {
  return (
    <div className="group-hover:scale-105 flex flex-col items-center gap-3 transition-transform">
      <div className="rounded-2xl bg-gray-100 p-4 transition-colors group-hover:bg-accent/10 dark:bg-white/5">
        {icon}
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-500 transition-colors group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white">
          {emptyLabel}
        </p>
        <p className="text-[10px] text-gray-500 dark:text-gray-600">{emptyHint}</p>
      </div>
    </div>
  )
}
