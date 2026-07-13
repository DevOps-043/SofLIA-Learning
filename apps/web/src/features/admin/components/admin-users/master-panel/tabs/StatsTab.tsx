'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AdminUser } from '../../../../services/adminUsers.service'
import { getMasterPanelDisplayName } from '../profile-form.service'
import { EMPTY_STATE_CLASS } from '../panel-ui'
import { OrgSelectorBar } from './OrgSelectorBar'

// El árbol de analytics (charts, PDF, AI insights) es pesado: se importa solo
// cuando el tab de estadísticas se muestra, no al abrir el panel en otro tab.
const BusinessUserAnalyticsPageClient = dynamic(
  () =>
    import(
      '../../../../../business-panel/components/business-user-analytics/BusinessUserAnalyticsPageClient'
    ).then((mod) => mod.BusinessUserAnalyticsPageClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    ),
  },
)

interface StatsTabProps {
  user: AdminUser
  orgOptions: Array<{ value: string; label: string }>
  selectedOrgId: string
  onOrgChange: (organizationId: string) => void
  organizationLabel?: string | null
}

export function StatsTab({
  user,
  orgOptions,
  selectedOrgId,
  onOrgChange,
  organizationLabel,
}: StatsTabProps) {
  const { t } = useTranslation('admin')

  if (orgOptions.length === 0) {
    return (
      <div className={EMPTY_STATE_CLASS}>
        <p className="text-sm text-gray-400">{t('users.stats.noOrganizations')}</p>
      </div>
    )
  }

  const selectedOrgLabel =
    orgOptions.find((option) => option.value === selectedOrgId)?.label ?? organizationLabel ?? null

  return (
    <div>
      <OrgSelectorBar orgOptions={orgOptions} selectedOrgId={selectedOrgId} onChange={onOrgChange} />
      {selectedOrgId ? (
        <BusinessUserAnalyticsPageClient
          embedded
          showEmbeddedPdfButton
          showBackButton={false}
          apiBasePath={`/api/admin/users/${user.id}/analytics`}
          organizationId={selectedOrgId}
          pdfExport={{
            userLabel: getMasterPanelDisplayName(user),
            organizationLabel: selectedOrgLabel,
          }}
        />
      ) : null}
    </div>
  )
}
