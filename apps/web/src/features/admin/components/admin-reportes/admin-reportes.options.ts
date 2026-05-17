import { AlertTriangle, CheckCircle2, Clock, FileText, Pencil, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface ReporteOption {
  value: string
  labelKey: string
}

export interface ReporteStatConfig {
  key: 'total' | 'pendientes' | 'en_progreso' | 'resueltos'
  labelKey: string
  icon: LucideIcon
  tone: 'primary' | 'warning' | 'accent' | 'success'
}

export const REPORTE_ESTADO_OPTIONS: ReporteOption[] = [
  { value: 'all', labelKey: 'reportesPage.filters.statusAll' },
  { value: 'pendiente', labelKey: 'reportesPage.status.pendiente' },
  { value: 'en_revision', labelKey: 'reportesPage.status.en_revision' },
  { value: 'en_progreso', labelKey: 'reportesPage.status.en_progreso' },
  { value: 'resuelto', labelKey: 'reportesPage.status.resuelto' },
  { value: 'rechazado', labelKey: 'reportesPage.status.rechazado' },
  { value: 'duplicado', labelKey: 'reportesPage.status.duplicado' },
]

export const REPORTE_CATEGORIA_OPTIONS: ReporteOption[] = [
  { value: 'all', labelKey: 'reportesPage.filters.categoryAll' },
  { value: 'bug', labelKey: 'reportesPage.category.bug' },
  { value: 'sugerencia', labelKey: 'reportesPage.category.sugerencia' },
  { value: 'contenido', labelKey: 'reportesPage.category.contenido' },
  { value: 'performance', labelKey: 'reportesPage.category.performance' },
  { value: 'ui-ux', labelKey: 'reportesPage.category.ui-ux' },
  { value: 'otro', labelKey: 'reportesPage.category.otro' },
]

export const REPORTE_PRIORIDAD_OPTIONS: ReporteOption[] = [
  { value: 'all', labelKey: 'reportesPage.filters.priorityAll' },
  { value: 'critica', labelKey: 'reportesPage.priority.critica' },
  { value: 'alta', labelKey: 'reportesPage.priority.alta' },
  { value: 'media', labelKey: 'reportesPage.priority.media' },
  { value: 'baja', labelKey: 'reportesPage.priority.baja' },
]

export const REPORTE_STATS: ReporteStatConfig[] = [
  { key: 'total', labelKey: 'reportesPage.stats.total', icon: AlertTriangle, tone: 'primary' },
  { key: 'pendientes', labelKey: 'reportesPage.stats.pending', icon: Clock, tone: 'warning' },
  { key: 'en_progreso', labelKey: 'reportesPage.stats.inProgress', icon: Pencil, tone: 'accent' },
  { key: 'resueltos', labelKey: 'reportesPage.stats.resolved', icon: CheckCircle2, tone: 'success' },
]

export const REPORTE_EMPTY_ICON = FileText
export const REPORTE_REJECTED_ICON = XCircle
