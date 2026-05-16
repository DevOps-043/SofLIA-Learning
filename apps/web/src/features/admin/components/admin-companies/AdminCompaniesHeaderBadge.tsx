'use client'

import { Building2 } from 'lucide-react'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

export function AdminCompaniesHeaderBadge() {
  const theme = useAdminPanelTheme()
  return (
    <div className="pointer-events-none absolute bottom-6 right-8 hidden h-20 w-20 items-center justify-center rounded-[2rem] border opacity-20 lg:flex" style={{ backgroundColor: theme.inverseSurface, borderColor: theme.inverseBorderColor, color: theme.inverseTextColor }}>
      <Building2 className="h-10 w-10" />
    </div>
  )
}
