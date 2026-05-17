import type {
  AdminReporte,
  ReporteFilters,
  ReporteStats,
  ReporteUpdateData,
} from '../services/adminReportes.service'

export interface AdminReportesPayload {
  reportes: AdminReporte[]
  stats: ReporteStats
}

export const EMPTY_REPORTE_STATS: ReporteStats = {
  total: 0,
  pendientes: 0,
  en_revision: 0,
  en_progreso: 0,
  resueltos: 0,
  rechazados: 0,
  porCategoria: {},
  porPrioridad: {},
}

function buildReportesUrl(filters: ReporteFilters) {
  const params = new URLSearchParams()
  if (filters.estado) params.append('estado', filters.estado)
  if (filters.categoria) params.append('categoria', filters.categoria)
  if (filters.prioridad) params.append('prioridad', filters.prioridad)
  if (filters.search) params.append('search', filters.search)
  const queryString = params.toString()
  return `/api/admin/reportes${queryString ? `?${queryString}` : ''}`
}

export async function fetchAdminReportes(filters: ReporteFilters): Promise<AdminReportesPayload> {
  const response = await fetch(buildReportesUrl(filters))
  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'load_failed')
  }

  return {
    reportes: data.reportes || [],
    stats: data.stats || EMPTY_REPORTE_STATS,
  }
}

export async function patchAdminReporte(reporteId: string, updates: ReporteUpdateData) {
  const response = await fetch('/api/admin/reportes', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: reporteId, ...updates }),
  })
  const data = await response.json()

  if (!response.ok || !data.success) {
    throw new Error(data.message || data.error || 'update_failed')
  }

  return data.reporte as AdminReporte
}
