'use client'

import { SwatchIcon } from '@heroicons/react/24/outline'
import { Card, colors } from '../shared'
import { CustomizationColorField } from './CustomizationColorField'
import type { CustomizationSectionProps } from './types'

export function CustomizationPaletteCard({ company, setCompany }: CustomizationSectionProps) {
  const primaryColor = company.brand_color_primary || '#3b82f6'
  const secondaryColor = company.brand_color_secondary || '#10b981'
  const accentColor = company.brand_color_accent || '#8b5cf6'

  return (
    <Card title="Paleta de Colores" description="Personaliza los colores de la marca" icon={SwatchIcon} iconColor={colors.pink}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <CustomizationColorField label="Color Primario" value={primaryColor} onChange={(value) => setCompany({ ...company, brand_color_primary: value })} />
        <CustomizationColorField label="Color Secundario" value={secondaryColor} onChange={(value) => setCompany({ ...company, brand_color_secondary: value })} />
        <CustomizationColorField label="Color de Acento" value={accentColor} onChange={(value) => setCompany({ ...company, brand_color_accent: value })} />
      </div>
      <div className="mt-6 rounded-xl bg-gray-50 p-4 dark:bg-[#0F1419]">
        <p className="mb-3 text-xs font-medium uppercase text-gray-500 dark:text-white/50">Vista previa</p>
        <div className="flex gap-3">
          <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: primaryColor }} />
          <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: secondaryColor }} />
          <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: accentColor }} />
        </div>
      </div>
    </Card>
  )
}
