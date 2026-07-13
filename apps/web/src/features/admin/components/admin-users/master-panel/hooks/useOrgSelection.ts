'use client'

import { useEffect, useMemo, useState } from 'react'
import type { MasterPanelMembership } from '../types'

/**
 * Selección de organización compartida por los tabs org-scoped (cursos, rutas,
 * estadísticas). Solo ofrece organizaciones donde el usuario tiene membresía
 * activa; preselecciona la organización filtrada en la página si aplica.
 */
export function useOrgSelection(
  memberships: MasterPanelMembership[],
  defaultOrganizationId?: string | null,
) {
  const activeMemberships = useMemo(
    () => memberships.filter((m) => m.status === 'active'),
    [memberships],
  )

  const orgOptions = useMemo(
    () =>
      activeMemberships.map((m) => ({
        value: m.organizationId,
        label: m.organizationName || m.organizationId,
      })),
    [activeMemberships],
  )

  const [selectedOrgId, setSelectedOrgId] = useState<string>('')

  useEffect(() => {
    if (selectedOrgId && activeMemberships.some((m) => m.organizationId === selectedOrgId)) return
    const preferred =
      defaultOrganizationId &&
      activeMemberships.some((m) => m.organizationId === defaultOrganizationId)
        ? defaultOrganizationId
        : activeMemberships[0]?.organizationId ?? ''
    setSelectedOrgId(preferred)
  }, [activeMemberships, defaultOrganizationId, selectedOrgId])

  return { orgOptions, selectedOrgId, setSelectedOrgId }
}
