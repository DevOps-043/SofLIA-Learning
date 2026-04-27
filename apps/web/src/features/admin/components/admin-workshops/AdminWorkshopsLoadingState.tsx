'use client'

import { AdminPageShell, AdminSurface } from '../ui'
import { useAdminTheme } from '../../hooks/useAdminTheme'

export function AdminWorkshopsLoadingState() {
  const theme = useAdminTheme()
  const skeletonStyle = {
    backgroundColor: theme.surfaceSubtle,
  }

  return (
    <AdminPageShell className="py-6 lg:py-8" maxWidth="wide">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-1/3 rounded-xl sm:w-1/4" style={skeletonStyle} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <AdminSurface key={index} className="h-28" />
          ))}
        </div>
        <AdminSurface className="h-16" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <AdminSurface key={index} className="h-64" />
          ))}
        </div>
      </div>
    </AdminPageShell>
  )
}
