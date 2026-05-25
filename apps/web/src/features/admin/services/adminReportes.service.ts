import {
  getReporteById,
  getReportes,
  getReporteStats,
  updateReporte,
} from './admin-reportes'
import type {
  AdminReporte,
  ReporteFilters,
  ReporteStats,
  ReporteUpdateData,
} from './admin-reportes/admin-reportes.types'

export type {
  AdminReporte,
  ReporteFilters,
  ReporteStats,
  ReporteUpdateData,
} from './admin-reportes/admin-reportes.types'

export class AdminReportesService {
  static async getReportes(filters?: ReporteFilters): Promise<AdminReporte[]> {
    return getReportes(filters)
  }

  static async getReporteById(reporteId: string): Promise<AdminReporte | null> {
    return getReporteById(reporteId)
  }

  static async updateReporte(
    reporteId: string,
    updates: ReporteUpdateData,
  ): Promise<AdminReporte> {
    return updateReporte(reporteId, updates)
  }

  static async getReporteStats(): Promise<ReporteStats> {
    return getReporteStats()
  }
}
