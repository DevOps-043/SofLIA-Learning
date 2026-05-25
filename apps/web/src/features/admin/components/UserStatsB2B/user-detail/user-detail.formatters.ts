import type { TFunction } from 'i18next'

export function formatUserStatsDate(date: string | null, t: TFunction) {
  if (!date) return t('userStats.lastLoginNever', { ns: 'admin' })
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatUserStatsGender(gender: string | null, t: TFunction) {
  return gender
    ? t(`demographics.gender.options.${gender}`, { ns: 'common', defaultValue: gender })
    : t('demographics.notSpecified', { ns: 'common' })
}
