'use client'

import { PaintBrushIcon } from '@heroicons/react/24/outline'
import { Card, colors } from '../shared'
import { VALID_FONTS } from './constants'
import type { CustomizationSectionProps } from './types'

export function CustomizationTypographyCard({ company, setCompany }: CustomizationSectionProps) {
  const fontFamily = company.brand_font_family || 'Inter'

  return (
    <Card title="Tipografía" description="Selecciona la fuente de la marca" icon={PaintBrushIcon} iconColor={colors.purple}>
      <div>
        <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-white/70">Fuente principal</label>
        <select
          value={fontFamily}
          onChange={(event) => setCompany({ ...company, brand_font_family: event.target.value })}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-primary focus:outline-none dark:border-white/10 dark:bg-carbon-900 dark:text-white dark:focus:border-accent"
        >
          {VALID_FONTS.map((font) => <option key={font} value={font}>{font}</option>)}
        </select>
      </div>
      <div className="mt-4 rounded-xl bg-gray-50 p-4 dark:bg-carbon-900">
        <p className="mb-3 text-xs font-medium uppercase text-gray-500 dark:text-white/50">Vista previa</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily }}>Vista previa de texto</p>
        <p className="mt-1 text-base text-gray-600 dark:text-white/70" style={{ fontFamily }}>
          Así se verá el texto con la fuente seleccionada
        </p>
      </div>
    </Card>
  )
}
