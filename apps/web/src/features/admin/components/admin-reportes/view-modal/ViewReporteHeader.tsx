'use client'

import { X } from 'lucide-react'
import { useAdminPanelTheme } from '../../../hooks/useAdminPanelTheme'
import type { AdminReporte } from '../../../services/adminReportes.service'

interface ViewReporteHeaderProps {
  reporte: AdminReporte
  onClose: () => void
}

export function ViewReporteHeader({ reporte, onClose }: ViewReporteHeaderProps) {
  const theme = useAdminPanelTheme()

  return (
    <header className="flex items-start justify-between gap-4 border-b px-6 py-5" style={{ borderColor: theme.borderColor }}>
      <div className="min-w-0">
        <h2 className="truncate text-xl font-semibold" style={{ color: theme.textColor }}>{reporte.titulo}</h2>
        <p className="mt-1 font-mono text-xs" style={{ color: theme.mutedTextColor }}>{reporte.id.slice(0, 8)}</p>
      </div>
      <button type="button" onClick={onClose} className="rounded-2xl border p-2" style={{ borderColor: theme.borderColor, color: theme.subtextColor }}>
        <X className="h-4 w-4" />
      </button>
    </header>
  )
}
