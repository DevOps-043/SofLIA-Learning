'use client'

import { type ReactNode } from 'react'

interface ActionButtonProps {
  icon: ReactNode
  label: string
  emphasis?: 'primary' | 'secondary'
}

export function ActionButton({
  icon,
  label,
  emphasis = 'secondary',
}: ActionButtonProps) {
  const className =
    emphasis === 'primary'
      ? 'bg-[#0A2540] text-white shadow-[0_12px_32px_rgba(10,37,64,0.24)]'
      : 'border border-[#DCE7F3] bg-[#F8FAFC] text-[#0A2540] dark:border-white/10 dark:bg-white/5 dark:text-white'

  return (
    <button
      type="button"
      className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition sm:w-auto ${className}`}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  )
}
