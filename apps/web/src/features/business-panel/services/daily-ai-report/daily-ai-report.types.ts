import type { BusinessUserAnalyticsLocale } from '../../types/business-user-analytics.types'

/** Informes que se acotan a uno por día natural. */
export type DailyAiReportType = 'org_reports_analytics' | 'user_stats'

export interface DailyAiReportRow {
  id: string
  report_type: DailyAiReportType
  organization_id: string
  subject_user_id: string | null
  locale: string
  scope_key: string
  report_date: string
  storage_path: string
  file_name: string
  byte_size: number
  model_name: string | null
  generated_by_user_id: string | null
  created_at: string
}

export interface DailyAiReportInsert {
  report_type: DailyAiReportType
  organization_id: string
  subject_user_id: string | null
  locale: string
  scope_key: string
  report_date: string
  storage_path: string
  file_name: string
  byte_size: number
  model_name: string | null
  generated_by_user_id: string | null
}

export interface DailyAiReportRequest {
  reportType: DailyAiReportType
  organizationId: string
  /** Usuario retratado en el informe. Nulo en los informes de organización. */
  subjectUserId?: string | null
  locale: BusinessUserAnalyticsLocale
  /**
   * Distingue variantes del mismo informe dentro del día (rango temporal,
   * filtros aplicados). Dos peticiones con distinto `scopeKey` son documentos
   * distintos y cada una se genera una vez al día.
   */
  scopeKey?: string
  generatedByUserId?: string | null
  /**
   * Solo se invoca cuando no existe el documento del día. Devuelve también el
   * nombre del archivo para que consultar el dataset —o cualquier otro trabajo
   * necesario para nombrarlo— no ocurra cuando el informe se reutiliza.
   */
  generate: () => Promise<DailyAiReportPayload>
}

export interface DailyAiReportPayload {
  bytes: Uint8Array
  fileName: string
  modelName?: string | null
}

export interface DailyAiReportDocument {
  bytes: Uint8Array
  fileName: string
  /** Día natural (zona horaria de la aplicación) al que pertenece el documento. */
  reportDate: string
  /** `true` si se reutilizó el documento ya generado hoy, sin llamar al modelo. */
  reused: boolean
  generatedAt: string
}
