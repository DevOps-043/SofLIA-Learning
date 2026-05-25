import type { ChangeEvent } from 'react'
import type { OrganizationTabStyles, OrganizationTabTheme } from './types'

export function SectionHeader({ description, icon, title, theme, styles }: {
  description: string
  icon: React.ReactNode
  title: string
  theme: OrganizationTabTheme
  styles: OrganizationTabStyles
}) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <div className="p-3 rounded-xl" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>{icon}</div>
      <div><h3 className="text-lg font-bold" style={styles.labelStyle}>{title}</h3><p className="text-sm" style={styles.helpStyle}>{description}</p></div>
    </div>
  )
}

export function TextField({ icon, id, label, name, onChange, placeholder, required, type = 'text', value, styles }: {
  icon?: React.ReactNode
  id: string
  label: string
  name: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  type?: string
  value: string | number
  styles: OrganizationTabStyles
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-2" style={styles.labelStyle}><span className="flex items-center gap-2">{icon}{label}</span></label>
      <input type={type} id={id} name={name} value={value} onChange={onChange} required={required} className="w-full px-4 py-3 rounded-xl border-2 transition-colors focus:outline-none" style={styles.inputStyle} placeholder={placeholder} />
    </div>
  )
}

export function TextAreaField({ help, id, label, maxLength, name, onChange, placeholder, rows, theme, value, styles }: {
  help?: string
  id: string
  label: string
  maxLength: number
  name: string
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
  placeholder: string
  rows: number
  theme: OrganizationTabTheme
  value: string
  styles: OrganizationTabStyles
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-2" style={styles.labelStyle}>{label}</label>
      <div className="relative">
        <textarea id={id} name={name} value={value} onChange={onChange} rows={rows} maxLength={maxLength} className="w-full px-4 py-3 rounded-xl border-2 transition-colors resize-none focus:outline-none" style={styles.inputStyle} placeholder={placeholder} />
        <div className="absolute bottom-3 right-3 text-xs px-2 py-1 rounded-full" style={{ backgroundColor: theme.hoverBg, color: theme.subtextColor }}>{value.length}/{maxLength}</div>
      </div>
      {help ? <p className="text-xs mt-1.5" style={styles.helpStyle}>{help}</p> : null}
    </div>
  )
}
