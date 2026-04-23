/**
 * Merges the return values of all learn-page sub-hooks into a single flat object.
 *
 * `UnionToIntersection` converts a union of object types (T[keyof T]) into their
 * intersection — meaning the result type contains every key from every sub-hook.
 * This lets TypeScript infer the full shape without requiring manual maintenance
 * of a large explicit interface.
 *
 * Consequence: if two sub-hooks return a key with the same name, TypeScript
 * will intersect their types (not override). Avoid duplicate key names across hooks.
 */
type UnionToIntersection<T> = (
  T extends unknown ? (value: T) => void : never
) extends (value: infer R) => void
  ? R
  : never

export function buildLearnPageLogicResult<T extends Record<string, object>>(
  parts: T,
): UnionToIntersection<T[keyof T]> {
  return Object.values(parts).reduce(
    (result, part) => ({ ...result, ...part }),
    {},
  ) as UnionToIntersection<T[keyof T]>
}
