export function normalizeEmptyInput(value: unknown) {
  return value === '' || value === undefined ? null : value
}
