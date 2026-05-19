'use client'

import type { ElementType } from 'react'

interface CompanyEditInputFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  icon?: ElementType
}

export function CompanyEditInputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  icon: Icon,
}: CompanyEditInputFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-white/70">{label}</label>
      <div className="relative">
        {Icon ? (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Icon className="h-4 w-4 text-gray-400 dark:text-muted" />
          </div>
        ) : null}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`rounded-xl border border-gray-200 bg-gray-50 py-2.5 pr-4 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-primary focus:outline-none dark:border-white/10 dark:bg-carbon-900 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-accent ${Icon ? 'w-full pl-10' : 'w-full px-4'}`}
        />
      </div>
    </div>
  )
}
