
export type ExportRow = Record<string, unknown>
export type ExportColumn = { key: string; header: string }

export type ExcelTableColumn = ExportColumn & {
  width?: number
  numberFormat?: string
  kind?: 'text' | 'integer' | 'decimal' | 'percent' | 'date'
}

export interface ExportCopy {
  title: string
  generatedAt: string
  period: string
  summary: string
  dashboard: string
  trends: string
  users: string
  courses: string
  segments: string
  activities: string
  quality: string
  dataQuality: string
  risks: string
  recommendations: string
  rawData: string
  missingField: string
  connections: string
  value: string
  detail: string
  metric: string
  chart: string
  noData: string
  files: Record<string, string>
  metrics: Record<string, string>
  columns: Record<string, string>
  dimensions: Record<string, Record<string, string>>
}
