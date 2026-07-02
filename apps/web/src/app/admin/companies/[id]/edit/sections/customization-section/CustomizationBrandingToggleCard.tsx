'use client'

import { SparklesIcon } from '@heroicons/react/24/outline'
import { Card, colors } from '../shared'
import type { CustomizationSectionProps } from './types'

export function CustomizationBrandingToggleCard({ company, setCompany }: CustomizationSectionProps) {
  const brandingEnabled = company.branding_enabled

  const toggle = () => setCompany({ ...company, branding_enabled: !brandingEnabled })

  return (
    <Card
      title="Colores de la organización"
      description="Controla si la plataforma usa la paleta personalizada o la paleta por defecto de SofLIA"
      icon={SparklesIcon}
      iconColor={colors.accent}
    >
      <div className="flex items-start justify-between gap-4 rounded-xl bg-gray-50 p-4 dark:bg-carbon-900">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {brandingEnabled ? 'Paleta personalizada activada' : 'Usando paleta por defecto de la plataforma'}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
            {brandingEnabled
              ? 'El panel, el dashboard de usuarios y el login usan los colores configurados debajo.'
              : 'Todas las superficies (panel, dashboard y login) usan la paleta SofLIA. Los colores personalizados se conservan y se reactivan al volver a activar esta opción.'}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={brandingEnabled}
          aria-label="Activar paleta personalizada de la organización"
          onClick={toggle}
          className={`relative mt-0.5 h-6 w-12 flex-shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            brandingEnabled ? 'bg-primary dark:bg-accent' : 'bg-gray-300 dark:bg-white/15'
          }`}
        >
          <span
            className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
            style={{ transform: brandingEnabled ? 'translateX(24px)' : 'translateX(0)' }}
          />
        </button>
      </div>
    </Card>
  )
}
