'use client'

import { ChevronDown } from 'lucide-react'

interface BrandingColorPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
  description?: string
}

export function BrandingColorPicker({ label, value, onChange }: BrandingColorPickerProps) {
  return (
    <div className="flex items-center gap-3">
      <label className="block text-sm font-medium w-32" style={{ color: 'var(--org-text-color, var(--color-bg-light))' }}>
        {label}
      </label>
      
      {/* Color Swatch */}
      <div className="relative">
        <div
          className="w-10 h-10 rounded border-2 cursor-pointer"
          style={{
            backgroundColor: value,
            borderColor: 'var(--org-border-color, var(--color-legacy-334155))'
          }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label={label}
            title={label}
          />
        </div>
      </div>

      {/* Hex Code Input with Dropdown */}
      <div className="flex-1 relative">
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => {
            const newValue = e.target.value
            if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newValue) || newValue === '') {
              onChange(newValue)
            }
          }}
          className="w-full pl-3 pr-10 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
          style={{
            backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), var(--org-card-opacity, 1))',
            borderColor: 'var(--org-border-color, var(--color-legacy-334155))',
            color: 'var(--org-text-color, var(--color-bg-light))'
          }}
          placeholder="var(--color-legacy-ff7300)"
          aria-label={`${label} color value`}
          title={`${label} color value`}
        />
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--org-text-color, var(--color-bg-light))' }} />
      </div>
    </div>
  )
}

