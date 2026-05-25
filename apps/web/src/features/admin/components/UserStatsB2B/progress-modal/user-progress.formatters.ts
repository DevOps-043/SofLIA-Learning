import type { TFunction } from 'i18next'

export function formatProgressDate(date: string | null, t: TFunction) {
  if (!date) return t('userStats.progressModal.na', { ns: 'admin' })
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatStudyHours(totalMinutes: number) {
  return Math.round((totalMinutes / 60) * 10) / 10
}
