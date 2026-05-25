import type { TFunction } from 'i18next'

export function getReporteLabel(t: TFunction, group: 'status' | 'category' | 'priority', value?: string | null) {
  if (!value) return t('reportesPage.noValue')
  return t(`reportesPage.${group}.${value}`, { defaultValue: value })
}

export function formatReporteDate(dateValue: string | null | undefined) {
  if (!dateValue) return 'N/A'
  return new Date(dateValue).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getReporterName(reporte: { usuario?: { display_name?: string | null; username: string } | null }) {
  return reporte.usuario?.display_name || reporte.usuario?.username || 'N/A'
}

export function getUrlPath(url: string) {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}
