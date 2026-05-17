import { z } from 'zod'
import { normalizeEmptyInput } from './input-normalization'

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MIN_DATE_OF_BIRTH = '1900-01-01'

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
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
  return value?.trim() || null
}

export const DateOfBirthSchema = z.preprocess(
  normalizeEmptyInput,
  z
    .string()
    .refine(isValidDateOfBirth, 'La fecha de nacimiento no es valida')
    .nullable(),
)
