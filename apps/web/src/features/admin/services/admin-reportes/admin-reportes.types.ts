import type { Json } from '../../../../lib/supabase/types'
import type { ReportProblemMetadata } from '../../../../core/reporting/report-problem.contract'

export interface AdminReporte {
  id: string
  user_id: string
  titulo: string
  descripcion: string
  categoria: string
  prioridad?: string | null
  pagina_url: string
  pathname?: string | null
  user_agent?: string | null
  screen_resolution?: string | null
  navegador?: string | null
  screenshot_url?: string | null
  pasos_reproducir?: string | null
  comportamiento_esperado?: string | null
  estado: string | null
  admin_asignado?: string | null
  notas_admin?: string | null
  created_at: string | null
  updated_at: string | null
  resuelto_at?: string | null
  metadata?: Json | ReportProblemMetadata | null
  usuario?: UserInfo | null
  admin_asignado_info?: AssignedAdminInfo | null
}

export interface UserInfo {
  id: string
  username: string
  email?: string | null
  display_name?: string | null
  profile_picture_url?: string | null
}

export interface AssignedAdminInfo {
  id: string
  username: string
  email?: string | null
  display_name?: string | null
}

export interface ReporteStats {
  total: number
  pendientes: number
  en_revision: number
  en_progreso: number
  resueltos: number
  rechazados: number
  porCategoria: Record<string, number>
  porPrioridad: Record<string, number>
}

export interface ReporteFilters {
  estado?: string
  categoria?: string
  prioridad?: string
  search?: string
}

export interface ReporteUpdateData {
  estado?: AdminReporte['estado']
  admin_asignado?: string
  notas_admin?: string
  prioridad?: AdminReporte['prioridad']
}
