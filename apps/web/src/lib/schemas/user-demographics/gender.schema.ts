import { z } from 'zod'
import { normalizeEmptyInput } from './input-normalization'

export const USER_GENDER_VALUES = [
  'female',
  'male',
  'non_binary',
  'other',
  'prefer_not_to_say',
] as const

export type UserGender = (typeof USER_GENDER_VALUES)[number]

export function isUserGender(value: unknown): value is UserGender {
  return (
    typeof value === 'string' &&
    USER_GENDER_VALUES.includes(value as UserGender)
  )
}

export function normalizeGenderForStorage(
  value: string | null | undefined,
): UserGender | null {
  const normalizedValue = value?.trim() || null
  return isUserGender(normalizedValue) ? normalizedValue : null
}

export const UserGenderSchema = z.preprocess(
  normalizeEmptyInput,
  z.enum(USER_GENDER_VALUES).nullable(),
)
