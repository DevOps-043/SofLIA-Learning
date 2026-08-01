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
  report_payload: unknown | null
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
  report_payload?: unknown | null
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
  /** Un solo informe por organizacion/dia, independientemente de idioma/filtros. */
  onePerOrganizationDay?: boolean
  /** Permite actualizar documentos legacy cuyo PDF existe pero carece de metadatos requeridos. */
  isMetadataValid?: (metadata: unknown) => boolean
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
  metadata?: unknown
}

export interface DailyAiReportRecord {
  fileName: string
  /** Día natural (zona horaria de la aplicación) al que pertenece el documento. */
  reportDate: string
  /** `true` si se reutilizó el documento ya generado hoy, sin llamar al modelo. */
  reused: boolean
  generatedAt: string
  locale: string
  metadata?: unknown
  storagePath: string
}

export interface DailyAiReportDocument extends DailyAiReportRecord {
  bytes: Uint8Array
}

export type DailyAiReportLookup = Omit<DailyAiReportRequest, 'generate' | 'generatedByUserId'>
