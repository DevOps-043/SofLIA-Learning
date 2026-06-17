'use client'

import { BusinessUserAnalyticsPageClient } from '@/features/business-panel/components/business-user-analytics/BusinessUserAnalyticsPageClient'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useOrganizationStore } from '@/core/stores/organizationStore'

export default function BusinessUserAnalyticsPage() {
  const { user } = useAuth()
  const organizationName = useOrganizationStore((state) => state.currentOrganization?.name) ?? null

  const userLabel =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
    user?.display_name ||
    user?.email ||
    'Usuario'

  return (
    <BusinessUserAnalyticsPageClient
      pdfExport={{ userLabel, organizationLabel: organizationName }}
    />
  )
}
