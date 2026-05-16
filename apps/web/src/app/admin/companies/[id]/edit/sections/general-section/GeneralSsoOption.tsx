'use client'

import type { ReactNode } from 'react'
import { CompanyToggle } from './CompanyToggle'

export function GeneralSsoOption({
  title,
  description,
  checked,
  icon,
  onToggle,
}: {
  title: string
  description: string
  checked: boolean
  icon: ReactNode
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-white/5 dark:bg-[#0F1419]">
      <div className="flex items-center gap-3">
        <div className="rounded-lg border border-gray-100 bg-white p-2 dark:border-white/10 dark:bg-white/5">{icon}</div>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{title}</p>
          <p className="text-xs text-gray-500 dark:text-[#8899A6]">{description}</p>
        </div>
      </div>
      <CompanyToggle checked={checked} label="" activeColor="#10B981" onToggle={onToggle} />
    </div>
  )
}
