import { z } from 'zod'

export const USER_GENDER_VALUES = [
  'female',
  'male',
  'non_binary',
  'other',
  'prefer_not_to_say',
] as const

export type UserGender = (typeof USER_GENDER_VALUES)[number]

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MIN_DATE_OF_BIRTH = '1900-01-01'

function normalizeEmptyInput(value: unknown) {
  return value === '' || value === undefined ? null : value
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function isUserGender(value: unknown): value is UserGender {
  return (
    typeof value === 'string' &&
    USER_GENDER_VALUES.includes(value as UserGender)
  )
}

export function isValidDateOfBirth(value: string, now = new Date()): boolean {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return false
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsedDate.getTime())) {
    return false
  }

  if (toDateOnly(parsedDate) !== value) {
    return false
  }

  return value >= MIN_DATE_OF_BIRTH && value <= toDateOnly(now)
}

export function calculateAgeFromDateOfBirth(
  dateOfBirth: string | null | undefined,
  now = new Date(),
): number | null {
  if (!dateOfBirth || !isValidDateOfBirth(dateOfBirth, now)) {
    return null
  }

  const [birthYear, birthMonth, birthDay] = dateOfBirth
    .split('-')
    .map(Number)
  const todayYear = now.getUTCFullYear()
  const todayMonth = now.getUTCMonth() + 1
  const todayDay = now.getUTCDate()

  let age = todayYear - birthYear
  if (
    todayMonth < birthMonth ||
    (todayMonth === birthMonth && todayDay < birthDay)
  ) {
    age -= 1
  }

  return age >= 0 ? age : null
}

export function normalizeDateOfBirthForStorage(
  value: string | null | undefined,
): string | null {
  const normalizedValue = value?.trim() || null
  return normalizedValue
}

export function normalizeGenderForStorage(
  value: string | null | undefined,
): UserGender | null {
  const normalizedValue = value?.trim() || null
  return isUserGender(normalizedValue) ? normalizedValue : null
}

export const DateOfBirthSchema = z.preprocess(
  normalizeEmptyInput,
  z
    .string()
    .refine(isValidDateOfBirth, 'La fecha de nacimiento no es valida')
    .nullable(),
)

export const UserGenderSchema = z.preprocess(
  normalizeEmptyInput,
  z.enum(USER_GENDER_VALUES).nullable(),
)

export const UserDemographicsSchema = z.object({
  date_of_birth: DateOfBirthSchema.optional(),
  gender: UserGenderSchema.optional(),
})

export const RegisterDemographicsSchema = z.object({
  dateOfBirth: DateOfBirthSchema.optional(),
  gender: UserGenderSchema.optional(),
})
