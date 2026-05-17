import { createAdminReportesClient } from './admin-reportes.client'
import { enrichReporte } from './admin-reportes.enrichment'
import { REPORTE_SELECT } from './admin-reportes.select'
import type { AdminReporte, ReporteFilters } from './admin-reportes.types'

export async function getReportes(filters?: ReporteFilters): Promise<AdminReporte[]> {
  const supabase = await createAdminReportesClient()
  let query = supabase
    .from('reportes_problemas')
    .select(REPORTE_SELECT)
    .order('created_at', { ascending: false })

  if (filters?.estado) query = query.eq('estado', filters.estado)
  if (filters?.categoria) query = query.eq('categoria', filters.categoria)
  if (filters?.prioridad) query = query.eq('prioridad', filters.prioridad)
  if (filters?.search) {
    query = query.or(`titulo.ilike.%${filters.search}%,descripcion.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) throw error

  return Promise.all(
    ((data || []) as AdminReporte[]).map((reporte) => enrichReporte(supabase, reporte)),
  )
}

export async function getReporteById(reporteId: string): Promise<AdminReporte | null> {
  const supabase = await createAdminReportesClient()
  const { data, error } = await supabase
    .from('reportes_problemas')
    .select(REPORTE_SELECT)
    .eq('id', reporteId)
    .single()

  if (error) throw error
  return data ? enrichReporte(supabase, data as AdminReporte) : null
}
