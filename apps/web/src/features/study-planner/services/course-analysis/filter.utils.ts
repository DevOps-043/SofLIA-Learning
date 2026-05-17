import { DEFAULT_MATERIAL_TIME_MINUTES } from './constants'

export function createPostgrestInFilter(values: string[]): string {
  const escapedValues = values.map((value) => `"${value.replaceAll('"', '\\"')}"`)
  return `(${escapedValues.join(',')})`
}

export function getMaterialFallbackMinutes(materialType?: string | null): number {
  switch (materialType) {
    case 'quiz':
      return 10
    case 'exercise':
      return 15
    case 'reading':
      return 10
    default:
      return DEFAULT_MATERIAL_TIME_MINUTES
  }
}
