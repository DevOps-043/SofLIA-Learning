import { createClient } from '../../../lib/supabase/server'
import type { Json } from '../../../lib/supabase/types'
import type { ReportProblemMetadata } from '../../../core/reporting/report-problem.contract'

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
  // Información del usuario (si está disponible)
  usuario?: {
    id: string
    username: string
    email?: string | null
    display_name?: string | null
    profile_picture_url?: string | null
  } | null
  // Información del admin asignado (si está disponible)
  admin_asignado_info?: {
    id: string
    username: string
    email?: string | null
    display_name?: string | null
  } | null
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

export class AdminReportesService {
  static async getReportes(filters?: {
    estado?: string
    categoria?: string
    prioridad?: string
    search?: string
  }): Promise<AdminReporte[]> {
    const supabase = await createClient()

    try {
      // Construir query base
      let query = supabase
        .from('reportes_problemas')
        .select(`
          id,
          user_id,
          titulo,
          descripcion,
          categoria,
          prioridad,
          pagina_url,
          pathname,
          user_agent,
          screen_resolution,
          navegador,
          screenshot_url,
          pasos_reproducir,
          comportamiento_esperado,
          estado,
          admin_asignado,
          notas_admin,
          created_at,
          updated_at,
          resuelto_at,
          metadata
        `)
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filters?.estado) {
        query = query.eq('estado', filters.estado)
      }
      if (filters?.categoria) {
        query = query.eq('categoria', filters.categoria)
      }
      if (filters?.prioridad) {
        query = query.eq('prioridad', filters.prioridad)
      }
      if (filters?.search) {
        query = query.or(`titulo.ilike.%${filters.search}%,descripcion.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      // Obtener información de usuarios
      const reportesConUsuarios = await Promise.all(
        (data || []).map(async (reporte) => {
          // Obtener información del usuario que reportó
          let usuarioInfo = null
          if (reporte.user_id) {
            const { data: usuario } = await supabase
              .from('users')
              .select('id, username, email, display_name, profile_picture_url')
              .eq('id', reporte.user_id)
              .single()
            
            if (usuario) {
              usuarioInfo = usuario
            }
          }

          // Obtener información del admin asignado
          let adminInfo = null
          if (reporte.admin_asignado) {
            const { data: admin } = await supabase
              .from('users')
              .select('id, username, email, display_name')
              .eq('id', reporte.admin_asignado)
              .single()
            
            if (admin) {
              adminInfo = admin
            }
          }

          return {
            ...reporte,
            usuario: usuarioInfo,
            admin_asignado_info: adminInfo
          }
        })
      )

      return reportesConUsuarios as AdminReporte[]
    } catch (error) {
      throw error
    }
  }

  static async getReporteById(reporteId: string): Promise<AdminReporte | null> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('reportes_problemas')
        .select(`
          id,
          user_id,
          titulo,
          descripcion,
          categoria,
          prioridad,
          pagina_url,
          pathname,
          user_agent,
          screen_resolution,
          navegador,
          screenshot_url,
          pasos_reproducir,
          comportamiento_esperado,
          estado,
          admin_asignado,
          notas_admin,
          created_at,
          updated_at,
          resuelto_at,
          metadata
        `)
        .eq('id', reporteId)
        .single()

      if (error) {
        throw error
      }

      if (!data) {
        return null
      }

      // Obtener información del usuario
      let usuarioInfo = null
      if (data.user_id) {
        const { data: usuario } = await supabase
          .from('users')
          .select('id, username, email, display_name, profile_picture_url')
          .eq('id', data.user_id)
          .single()
        
        if (usuario) {
          usuarioInfo = usuario
        }
      }

      // Obtener información del admin asignado
      let adminInfo = null
      if (data.admin_asignado) {
        const { data: admin } = await supabase
          .from('users')
          .select('id, username, email, display_name')
          .eq('id', data.admin_asignado)
          .single()
        
        if (admin) {
          adminInfo = admin
        }
      }

      return {
        ...data,
        usuario: usuarioInfo,
        admin_asignado_info: adminInfo
      }
    } catch (error) {
      throw error
    }
  }

  static async updateReporte(
    reporteId: string,
    updates: {
      estado?: AdminReporte['estado']
      admin_asignado?: string
      notas_admin?: string
      prioridad?: AdminReporte['prioridad']
    }
  ): Promise<AdminReporte> {
    const supabase = await createClient()

    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      }

      if (updates.estado !== undefined) {
        updateData.estado = updates.estado
        // Si se marca como resuelto, establecer resuelto_at
        if (updates.estado === 'resuelto' && !updateData.resuelto_at) {
          updateData.resuelto_at = new Date().toISOString()
        }
      }
      if (updates.admin_asignado !== undefined) {
        updateData.admin_asignado = updates.admin_asignado
      }
      if (updates.notas_admin !== undefined) {
        updateData.notas_admin = updates.notas_admin
      }
      if (updates.prioridad !== undefined) {
        updateData.prioridad = updates.prioridad
      }

      const { data, error } = await supabase
        .from('reportes_problemas')
        .update(updateData)
        .eq('id', reporteId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data as AdminReporte
    } catch (error) {
      throw error
    }
  }

  static async getReporteStats(): Promise<ReporteStats> {
    const supabase = await createClient()

    try {
      // Obtener todos los reportes para calcular estadísticas
      const { data: reportes, error } = await supabase
        .from('reportes_problemas')
        .select('estado, categoria, prioridad')

      if (error) {
        throw error
      }

      const stats: ReporteStats = {
        total: reportes?.length || 0,
        pendientes: 0,
        en_revision: 0,
        en_progreso: 0,
        resueltos: 0,
        rechazados: 0,
        porCategoria: {},
        porPrioridad: {}
      }

      // Contar por estado
      reportes?.forEach((reporte) => {
        switch (reporte.estado) {
          case 'pendiente':
            stats.pendientes++
            break
          case 'en_revision':
            stats.en_revision++
            break
          case 'en_progreso':
            stats.en_progreso++
            break
          case 'resuelto':
            stats.resueltos++
            break
          case 'rechazado':
          case 'duplicado':
            stats.rechazados++
            break
        }

        // Contar por categoría
        const cat = reporte.categoria || 'otro'
        stats.porCategoria[cat] = (stats.porCategoria[cat] || 0) + 1

        // Contar por prioridad
        const pri = reporte.prioridad || 'media'
        stats.porPrioridad[pri] = (stats.porPrioridad[pri] || 0) + 1
      })

      return stats
    } catch (error) {
      throw error
    }
  }
}
