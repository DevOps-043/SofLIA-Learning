import type { Json } from '../json'

export type ReportesProblemasTable = {
  Row: {
  admin_asignado: string | null
  categoria: string
  comportamiento_esperado: string | null
  created_at: string | null
  descripcion: string
  estado: string | null
  id: string
  metadata: Json | null
  navegador: string | null
  notas_admin: string | null
  pagina_url: string
  pasos_reproducir: string | null
  pathname: string | null
  prioridad: string | null
  recording_duration: number | null
  recording_size: string | null
  resuelto_at: string | null
  screen_resolution: string | null
  screenshot_url: string | null
  session_recording: string | null
  titulo: string
  updated_at: string | null
  user_agent: string | null
  user_id: string
}
  Insert: {
  admin_asignado?: string | null
  categoria: string
  comportamiento_esperado?: string | null
  created_at?: string | null
  descripcion: string
  estado?: string | null
  id?: string
  metadata?: Json | null
  navegador?: string | null
  notas_admin?: string | null
  pagina_url: string
  pasos_reproducir?: string | null
  pathname?: string | null
  prioridad?: string | null
  recording_duration?: number | null
  recording_size?: string | null
  resuelto_at?: string | null
  screen_resolution?: string | null
  screenshot_url?: string | null
  session_recording?: string | null
  titulo: string
  updated_at?: string | null
  user_agent?: string | null
  user_id: string
}
  Update: {
  admin_asignado?: string | null
  categoria?: string
  comportamiento_esperado?: string | null
  created_at?: string | null
  descripcion?: string
  estado?: string | null
  id?: string
  metadata?: Json | null
  navegador?: string | null
  notas_admin?: string | null
  pagina_url?: string
  pasos_reproducir?: string | null
  pathname?: string | null
  prioridad?: string | null
  recording_duration?: number | null
  recording_size?: string | null
  resuelto_at?: string | null
  screen_resolution?: string | null
  screenshot_url?: string | null
  session_recording?: string | null
  titulo?: string
  updated_at?: string | null
  user_agent?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "reportes_problemas_admin_asignado_fkey"; columns: ["admin_asignado"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "reportes_problemas_admin_asignado_fkey"; columns: ["admin_asignado"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "reportes_problemas_admin_asignado_fkey"; columns: ["admin_asignado"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "reportes_problemas_admin_asignado_fkey"; columns: ["admin_asignado"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
    { foreignKeyName: "reportes_problemas_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "reportes_problemas_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "reportes_problemas_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "reportes_problemas_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
