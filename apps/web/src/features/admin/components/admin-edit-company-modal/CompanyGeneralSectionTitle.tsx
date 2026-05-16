'use client'

import type { ComponentType } from 'react'

export function CompanyGeneralSectionTitle(props: { icon: ComponentType<{ className?: string }>; title: string }) {
  const Icon = props.icon
  return (
    <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-sm font-bold uppercase tracking-wider text-white/50">
      <Icon className="h-4 w-4" />
      {props.title}
    </div>
  )
}
