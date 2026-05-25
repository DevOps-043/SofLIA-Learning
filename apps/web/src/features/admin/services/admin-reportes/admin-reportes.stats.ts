import { createAdminReportesClient } from './admin-reportes.client'
import type { ReporteStats } from './admin-reportes.types'

const EMPTY_STATS: ReporteStats = {
  total: 0,
  pendientes: 0,
  en_revision: 0,
  en_progreso: 0,
  resueltos: 0,
  rechazados: 0,
  porCategoria: {},
  porPrioridad: {},
}

function incrementStatus(stats: ReporteStats, estado: string | null) {
  switch (estado) {
    case 'pendiente':
      stats.pendientes += 1
      break
    case 'en_revision':
      stats.en_revision += 1
      break
    case 'en_progreso':
      stats.en_progreso += 1
      break
    case 'resuelto':
      stats.resueltos += 1
      break
    case 'rechazado':
    case 'duplicado':
      stats.rechazados += 1
      break
  }
}

export async function getReporteStats(): Promise<ReporteStats> {
  const supabase = await createAdminReportesClient()
  const { data: reportes, error } = await supabase
    .from('reportes_problemas')
    .select('estado, categoria, prioridad')

  if (error) throw error

  return (reportes || []).reduce<ReporteStats>((stats, reporte) => {
    incrementStatus(stats, reporte.estado)
    const category = reporte.categoria || 'otro'
    const priority = reporte.prioridad || 'media'
    stats.porCategoria[category] = (stats.porCategoria[category] || 0) + 1
    stats.porPrioridad[priority] = (stats.porPrioridad[priority] || 0) + 1
    return stats
  }, { ...EMPTY_STATS, total: reportes?.length || 0, porCategoria: {}, porPrioridad: {} })
}
