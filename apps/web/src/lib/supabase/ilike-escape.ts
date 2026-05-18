/**
 * Escapa los metacaracteres de SQL LIKE/ILIKE para que el patrón coincida
 * literalmente con la entrada del usuario (case-insensitive cuando se usa ILIKE).
 *
 * Sin este escape, valores como `isra_elmtz` se interpretan como un patrón
 * con wildcards: `_` matchea cualquier carácter individual y `%` cualquier
 * secuencia. Eso provoca falsos positivos múltiples que rompen `.single()` /
 * `.maybeSingle()` y, peor aún, permiten que un atacante adivine usuarios
 * por patrón.
 *
 * PostgreSQL ILIKE usa `\` como carácter de escape por defecto, por lo que
 * `isra\_elmtz` matchea el guion bajo literal.
 */
export function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/[%_]/g, '\\$&')
}
