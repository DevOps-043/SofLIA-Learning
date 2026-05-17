import type { ChangeEvent } from 'react'
import type { OrganizationTheme } from './types'

export function TextAreaField({
  help,
  label,
  maxLength,
  name,
  onChange,
  placeholder,
  rows,
  theme,
  value,
}: {
  help?: string
  label: string
  maxLength: number
  name: string
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
  placeholder: string
  rows: number
  theme: OrganizationTheme
  value: string
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium mb-2" style={{ color: theme.textColor }}>
        {label}
      </label>
      <div className="relative">
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          rows={rows}
          maxLength={maxLength}
          className="w-full px-4 py-3 rounded-xl border-2 transition-colors resize-none focus:outline-none"
          style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}
          placeholder={placeholder}
        />
        <div className="absolute bottom-3 right-3 text-xs px-2 py-1 rounded-full" style={{ backgroundColor: theme.hoverBg, color: theme.subtextColor }}>
          {value.length}/{maxLength}
        </div>
      </div>
      {help ? <p className="text-xs mt-1.5" style={{ color: theme.subtextColor }}>{help}</p> : null}
    </div>
  )
}
