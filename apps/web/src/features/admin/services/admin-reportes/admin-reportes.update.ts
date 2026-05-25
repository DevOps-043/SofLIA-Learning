import { createAdminReportesClient } from './admin-reportes.client'
import type { AdminReporte, ReporteUpdateData } from './admin-reportes.types'

function buildReporteUpdateData(updates: ReporteUpdateData): Record<string, unknown> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.estado !== undefined) {
    updateData.estado = updates.estado
    if (updates.estado === 'resuelto') {
      updateData.resuelto_at = new Date().toISOString()
    }
  }
  if (updates.admin_asignado !== undefined) updateData.admin_asignado = updates.admin_asignado
  if (updates.notas_admin !== undefined) updateData.notas_admin = updates.notas_admin
  if (updates.prioridad !== undefined) updateData.prioridad = updates.prioridad

  return updateData
}

export async function updateReporte(
  reporteId: string,
  updates: ReporteUpdateData,
): Promise<AdminReporte> {
  const supabase = await createAdminReportesClient()
  const { data, error } = await supabase
    .from('reportes_problemas')
    .update(buildReporteUpdateData(updates))
    .eq('id', reporteId)
    .select()
    .single()

  if (error) throw error
  return data as AdminReporte
}
