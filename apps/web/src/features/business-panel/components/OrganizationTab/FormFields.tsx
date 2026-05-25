import type { ChangeEvent, ReactNode } from 'react'
import type { OrganizationTheme } from './types'

type FieldChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void

export function TextField({
  icon,
  label,
  name,
  onChange,
  placeholder,
  required,
  theme,
  type = 'text',
  value,
}: {
  icon?: ReactNode
  label: string
  name: string
  onChange: FieldChange
  placeholder?: string
  required?: boolean
  theme: OrganizationTheme
  type?: string
  value: string
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium mb-2" style={{ color: theme.textColor }}>
        {icon ? <span className="flex items-center gap-2">{icon}{label}</span> : label}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-3 rounded-xl border-2 transition-colors focus:outline-none"
        style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}
        placeholder={placeholder}
      />
    </div>
  )
}

export function SelectField({
  icon,
  label,
  name,
  onChange,
  options,
  placeholder,
  theme,
  value,
}: {
  icon?: ReactNode
  label: string
  name: string
  onChange: FieldChange
  options: Array<{ label: string; value: string }>
  placeholder: string
  theme: OrganizationTheme
  value: string
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium mb-2" style={{ color: theme.textColor }}>
        {icon ? <span className="flex items-center gap-2">{icon}{label}</span> : label}
      </label>
      <select id={name} name={name} value={value} onChange={onChange} className="w-full px-4 py-3 rounded-xl border-2 transition-colors focus:outline-none" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}>
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  )
}
