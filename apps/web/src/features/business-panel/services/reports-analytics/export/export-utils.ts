
import type { ReportsAnalyticsLocale } from '../../../types/reports-analytics.types'
import type { ExportCopy } from './export.types'

export function translateDimension(copy: ExportCopy, group: string, key: string, fallback = key): string {
  return copy.dimensions[group]?.[key] || fallback
}

export function translateWeekday(dayKey: string): string {
  const days: Record<string, string> = {
    sun: 'Dom',
    mon: 'Lun',
    tue: 'Mar',
    wed: 'Mie',
    thu: 'Jue',
    fri: 'Vie',
    sat: 'Sab',
  }
  return days[dayKey] || dayKey
}

export function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value / 100))
}

export function sanitizeSheetName(name: string): string {
  return name.replace(/[\][:*?/\\]/g, ' ').slice(0, 31) || 'Reporte'
}

export function sanitizeTableName(name: string): string {
  const sanitized = name.replace(/[^A-Za-z0-9_]/g, '_').replace(/^(\d)/, '_$1')
  return sanitized.slice(0, 240) || 'ReportTable'
}

export function getColumnLetter(index: number): string {
  let current = index
  let letters = ''
  while (current > 0) {
    const remainder = (current - 1) % 26
    letters = String.fromCharCode(65 + remainder) + letters
    current = Math.floor((current - remainder) / 26)
  }
  return letters
}

export function formatDate(value: string, locale: ReportsAnalyticsLocale): string {
  return new Date(value).toLocaleDateString(locale)
}
