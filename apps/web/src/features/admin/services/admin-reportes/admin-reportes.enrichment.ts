import type { AdminReporte, AssignedAdminInfo, UserInfo } from './admin-reportes.types'
import type { createAdminReportesClient } from './admin-reportes.client'
import { createSignedReportEvidenceUrl } from '@/core/reporting/report-evidence.server'

type ReportesClient = Awaited<ReturnType<typeof createAdminReportesClient>>

async function getUserInfo(
  supabase: ReportesClient,
  userId: string | null | undefined,
): Promise<UserInfo | null> {
  if (!userId) return null

  const { data } = await supabase
    .from('users')
    .select('id, username, email, display_name, profile_picture_url')
    .eq('id', userId)
    .single()

  return data || null
}

async function getAdminInfo(
  supabase: ReportesClient,
  adminId: string | null | undefined,
): Promise<AssignedAdminInfo | null> {
  if (!adminId) return null

  const { data } = await supabase
    .from('users')
    .select('id, username, email, display_name')
    .eq('id', adminId)
    .single()

  return data || null
}

export async function enrichReporte(
  supabase: ReportesClient,
  reporte: AdminReporte,
): Promise<AdminReporte> {
  const [usuario, adminAsignadoInfo, screenshotUrl] = await Promise.all([
    getUserInfo(supabase, reporte.user_id),
    getAdminInfo(supabase, reporte.admin_asignado),
    createSignedReportEvidenceUrl(reporte.screenshot_url),
  ])

  return {
    ...reporte,
    screenshot_url: screenshotUrl,
    usuario,
    admin_asignado_info: adminAsignadoInfo,
  }
}
