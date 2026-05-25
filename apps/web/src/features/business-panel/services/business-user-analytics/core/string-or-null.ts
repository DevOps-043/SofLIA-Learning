export function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null
}
