'use client'

import { Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PremiumSelect } from '../../../../../business-panel/components/PremiumSelect'

interface OrgSelectorBarProps {
  orgOptions: Array<{ value: string; label: string }>
  selectedOrgId: string
  onChange: (organizationId: string) => void
}

/** Selector de organización compartido por los tabs de cursos, rutas y estadísticas. */
export function OrgSelectorBar({ orgOptions, selectedOrgId, onChange }: OrgSelectorBarProps) {
  const { t } = useTranslation('admin')

  if (orgOptions.length === 0) return null
  if (orgOptions.length === 1) {
    return (
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-white/80">
        <Building2 className="h-4 w-4 text-gray-500 dark:text-white/60" />
        {orgOptions[0].label}
      </div>
    )
  }

  return (
    <div className="mb-4 max-w-xs">
      <PremiumSelect
        value={selectedOrgId}
        onChange={onChange}
        options={orgOptions}
        placeholder={t('users.masterPanel.organizations.organizationLabel')}
        icon={<Building2 className="h-4 w-4" />}
      />
    </div>
  )
}
