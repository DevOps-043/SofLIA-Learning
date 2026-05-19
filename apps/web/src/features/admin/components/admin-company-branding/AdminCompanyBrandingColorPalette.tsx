'use client'

import type { BrandingColorField } from './types'
import { AdminCompanyBrandingColorCard } from './AdminCompanyBrandingColorCard'

interface AdminCompanyBrandingColorPaletteProps<T extends string> {
  fields: readonly BrandingColorField<T>[]
  values: Record<T, string>
  onChange: (key: T, value: string) => void
  dark?: boolean
}

export function AdminCompanyBrandingColorPalette<T extends string>({
  fields,
  values,
  onChange,
  dark = false,
}: AdminCompanyBrandingColorPaletteProps<T>) {
  return (
    <div>
      <label className={`mb-4 block border-b pb-2 text-xs font-bold uppercase tracking-wider ${dark ? 'border-white/5 text-gray-400' : 'border-gray-200 text-gray-600 dark:text-gray-400'}`}>
        Paleta de Colores Personalizada
      </label>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {fields.map((field) => (
          <AdminCompanyBrandingColorCard
            key={field.key}
            label={field.label}
            value={values[field.key]}
            onChange={(value) => onChange(field.key, value)}
            dark={dark}
          />
        ))}
      </div>
    </div>
  )
}
