'use client'

import { BuildingOffice2Icon } from '@heroicons/react/24/outline'
import { Card, InputField } from '../shared'
import type { GeneralSectionProps } from './types'

export function GeneralBasicInfoCard({ company, setCompany }: GeneralSectionProps) {
  return (
    <Card title="Información Básica" description="Datos principales de la empresa" icon={BuildingOffice2Icon}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputField label="Nombre de la empresa" value={company.name} onChange={(value) => setCompany({ ...company, name: value })} />
        <InputField
          label="Slug (URL)"
          value={company.slug || ''}
          onChange={(value) => setCompany({ ...company, slug: value.toLowerCase().replace(/\s+/g, '-') })}
          placeholder="mi-empresa"
        />
      </div>
      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-white/70">Descripción</label>
        <textarea
          value={company.description || ''}
          onChange={(event) => setCompany({ ...company, description: event.target.value })}
          rows={3}
          className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-primary focus:outline-none dark:border-white/10 dark:bg-carbon-900 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-accent"
          placeholder="Descripción de la empresa..."
        />
      </div>
    </Card>
  )
}
