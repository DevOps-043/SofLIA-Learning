'use client'

import { Cog6ToothIcon } from '@heroicons/react/24/outline'
import { Card, colors } from '../shared'
import { CompanyToggle } from './CompanyToggle'
import type { GeneralSectionProps } from './types'

export function GeneralLimitsCard({ company, setCompany }: GeneralSectionProps) {
  return (
    <Card title="Estado y Límites" description="Configuración de estado de la empresa" icon={Cog6ToothIcon} iconColor={colors.warning}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-white/70">Máximo de usuarios</label>
          <input
            type="number"
            min="1"
            value={company.max_users || ''}
            onChange={(event) => setCompany({ ...company, max_users: parseInt(event.target.value) || null })}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-[#0A2540] focus:outline-none dark:border-white/10 dark:bg-[#0F1419] dark:text-white dark:focus:border-[#00D4B3]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-white/70">Estado de la empresa</label>
          <CompanyToggle
            checked={company.is_active}
            label={company.is_active ? 'Empresa activa' : 'Empresa pausada'}
            activeColor={colors.success}
            onToggle={() => setCompany({ ...company, is_active: !company.is_active })}
          />
        </div>
      </div>
    </Card>
  )
}
