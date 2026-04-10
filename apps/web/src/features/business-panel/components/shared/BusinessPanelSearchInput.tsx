'use client'

import type { ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'

interface BusinessPanelSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  rightSlot?: ReactNode
  className?: string
}

export function BusinessPanelSearchInput({
  value,
  onChange,
  placeholder,
  rightSlot,
  className = '',
}: BusinessPanelSearchInputProps) {
  const { cardBg, borderColor, textColor, mutedTextColor } = useBusinessPanelTheme()

  return (
    <div className={`relative group ${className}`}>
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-opacity opacity-50 group-focus-within:opacity-80"
        style={{ color: mutedTextColor }}
      />

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-12 py-3.5 rounded-2xl border focus:outline-none transition-all duration-300"
        style={{
          backgroundColor: cardBg,
          borderColor,
          color: textColor,
        }}
      />

      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors"
          style={{ color: mutedTextColor }}
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      ) : (
        rightSlot
      )}
    </div>
  )
}
