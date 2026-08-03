/**
 * Caché en proceso, con TTL, para los catálogos de detección de menciones.
 *
 * Por qué existe: para saber de qué organización o de qué curso habla el
 * administrador hay que comparar su mensaje contra la lista real de entidades,
 * y eso ocurre en CADA turno del chat. Los catálogos son listas pequeñas
 * (id + nombre + slug) que cambian pocas veces al día, así que releerlas en cada
 * turno es puro coste sin beneficio.
 *
 * Es deliberadamente simple:
 *  - TTL corto: un curso o una empresa recién creados aparecen en menos de un
 *    minuto, y mientras tanto el administrador puede nombrarlos por UUID.
 *  - Por proceso: no hay invalidación distribuida ni la necesita. Cada instancia
 *    converge sola al vencer el TTL.
 *  - Sin caché negativa de errores: si la carga falla, el fallo no se memoriza,
 *    de modo que el siguiente turno vuelve a intentarlo.
 *
 * La clave debe incluir el alcance del actor (por ejemplo, el id del tenant):
 * dos administradores de organizaciones distintas NO pueden compartir entrada.
 */

export interface CatalogCache<TValue> {
  get(key: string, loader: () => Promise<TValue>): Promise<TValue>
  /** Vacía la caché. Solo para tests. */
  clear(): void
}

interface CacheEntry<TValue> {
  value: TValue
  expiresAt: number
}

/** Tope de entradas para que la caché no crezca sin límite con muchos tenants. */
const MAX_ENTRIES = 200

export function createCatalogCache<TValue>(ttlMs: number): CatalogCache<TValue> {
  const store = new Map<string, CacheEntry<TValue>>()

  return {
    async get(key, loader) {
      const cached = store.get(key)
      if (cached && cached.expiresAt > Date.now()) {
        return cached.value
      }

      const value = await loader()

      if (store.size >= MAX_ENTRIES) {
        // Descarte simple del más antiguo insertado: basta para acotar memoria.
        const oldestKey = store.keys().next().value
        if (oldestKey !== undefined) store.delete(oldestKey)
      }
      store.set(key, { value, expiresAt: Date.now() + ttlMs })

      return value
    },
    clear() {
      store.clear()
    },
  }
}

/** TTL compartido por los catálogos de lookup administrativo. */
export const CATALOG_CACHE_TTL_MS = 60_000
