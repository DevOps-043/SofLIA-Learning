'use client'

import dynamic from 'next/dynamic'
import { FileText, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AdminUser } from '../../../../services/adminUsers.service'
import { getMasterPanelDisplayName } from '../profile-form.service'
import { EMPTY_STATE_CLASS } from '../panel-ui'
import { useForensicReport } from '../hooks/useForensicReport'
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
      <div className="mb-3 flex justify-end">
        <ForensicReportButton user={user} />
      </div>
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

/** Solo el botón de dictamen forense (PDF generado por SofLIA), sin el panel de auditoría. */
function ForensicReportButton({ user }: { user: AdminUser }) {
  const { t } = useTranslation('admin')
  const report = useForensicReport(user.id, getMasterPanelDisplayName(user), user.email ?? null)

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void report.generate()}
        disabled={report.isGenerating}
        className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {report.isGenerating ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileText className="h-3.5 w-3.5" />
        )}
        {report.isGenerating
          ? t('users.masterPanel.audit.report.generating')
          : t('users.masterPanel.audit.report.generate')}
      </button>
      {report.error ? <span className="text-[11px] text-red-500">{report.error}</span> : null}
    </div>
  )
}
