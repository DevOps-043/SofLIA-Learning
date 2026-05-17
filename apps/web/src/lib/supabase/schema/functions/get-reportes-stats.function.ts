import type { Json } from '../json'

export type GetReportesStatsFunction = {
  Args: never
  Returns: {
    en_progreso: number
    en_revision: number
    pendientes: number
    por_categoria: Json
    resueltos: number
    tiempo_promedio_resolucion: unknown
    total_reportes: number
  }[]
}
