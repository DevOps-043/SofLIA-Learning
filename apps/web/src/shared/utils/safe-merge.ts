/**
 * Utilidades seguras para prevenir ataques de Prototype Pollution
 *
 * @see https://owasp.org/www-community/attacks/Prototype_Pollution
 */

type SafeMergeRecord = Record<string, unknown>

/**
 * Lista de keys peligrosas que pueden contaminar prototipos
 */
const DANGEROUS_KEYS = [
  '__proto__',
  'constructor',
  'prototype',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
] as const

function isMergeableRecord(value: unknown): value is SafeMergeRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Verifica si una key es peligrosa para el prototipo
 */
export function isDangerousKey(key: string): boolean {
  return (DANGEROUS_KEYS as readonly string[]).includes(key)
}

/**
 * Filtra un objeto removiendo keys peligrosas
 */
export function sanitizeObject<T extends SafeMergeRecord>(obj: T): Partial<T> {
  if (!isMergeableRecord(obj)) {
    return obj
  }

  const sanitized: Partial<T> = {}

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && !isDangerousKey(key)) {
      const value = obj[key]

      if (isMergeableRecord(value)) {
        sanitized[key as keyof T] = sanitizeObject(value) as T[keyof T]
      } else {
        sanitized[key as keyof T] = value as T[keyof T]
      }
    }
  }

  return sanitized
}

/**
 * Merge seguro de objetos que previene Prototype Pollution
 *
 * @param target - Objeto destino
 * @param sources - Objetos fuente a mergear
 * @returns Objeto mergeado sin keys peligrosas
 *
 * @example
 * const user = { name: 'John' };
 * const maliciousData = { __proto__: { isAdmin: true } };
 * const result = safeMerge(user, maliciousData);
 * // result = { name: 'John' } (sin __proto__)
 */
export function safeMerge<T extends SafeMergeRecord>(
  target: T,
  ...sources: Array<SafeMergeRecord | null | undefined>
): T {
  const result = { ...target }

  for (const source of sources) {
    if (!isMergeableRecord(source)) {
      continue
    }

    const sanitizedSource = sanitizeObject(source)

    for (const key in sanitizedSource) {
      if (Object.prototype.hasOwnProperty.call(sanitizedSource, key)) {
        result[key as keyof T] = sanitizedSource[key] as T[keyof T]
      }
    }
  }

  return result
}

/**
 * Assign seguro que previene Prototype Pollution
 * Similar a Object.assign pero con validaciÃ³n de keys peligrosas
 *
 * @param target - Objeto destino
 * @param sources - Objetos fuente
 * @returns Objeto destino modificado
 */
export function safeAssign<T extends SafeMergeRecord>(
  target: T,
  ...sources: Array<SafeMergeRecord | null | undefined>
): T {
  for (const source of sources) {
    if (!isMergeableRecord(source)) {
      continue
    }

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key) && !isDangerousKey(key)) {
        const value = source[key]

        if (isMergeableRecord(value)) {
          target[key as keyof T] = sanitizeObject(value) as T[keyof T]
        } else {
          target[key as keyof T] = value as T[keyof T]
        }
      }
    }
  }

  return target
}

/**
 * Crea un objeto sin prototipo (mÃ¡s seguro para datos externos)
 *
 * @param obj - Objeto fuente
 * @returns Objeto sin prototipo con los mismos datos
 *
 * @example
 * const safe = createSafeObject({ name: 'John' });
 * console.log(safe.__proto__); // undefined
 */
export function createSafeObject<T extends SafeMergeRecord>(obj: T): T {
  const safe: SafeMergeRecord = Object.create(null)
  const sanitized = sanitizeObject(obj)

  for (const key in sanitized) {
    if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
      safe[key] = sanitized[key]
    }
  }

  return safe as T
}

/**
 * Valida que un objeto no contenga keys peligrosas
 * Ãštil para validaciÃ³n de entrada antes de procesamiento
 *
 * @param obj - Objeto a validar
 * @returns true si el objeto es seguro, false si contiene keys peligrosas
 */
export function isObjectSafe(obj: SafeMergeRecord): boolean {
  if (!isMergeableRecord(obj)) {
    return true
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (isDangerousKey(key)) {
        return false
      }

      const value = obj[key]
      if (isMergeableRecord(value) && !isObjectSafe(value)) {
        return false
      }
    }
  }

  return true
}

/**
 * Valida y lanza error si el objeto contiene keys peligrosas
 *
 * @param obj - Objeto a validar
 * @param context - Contexto para el mensaje de error (opcional)
 * @throws Error si el objeto contiene keys peligrosas
 */
export function validateObject(obj: SafeMergeRecord, context?: string): void {
  if (!isObjectSafe(obj)) {
    const contextMsg = context ? ` (${context})` : ''
    throw new Error(`Objeto contiene keys peligrosas que pueden causar Prototype Pollution${contextMsg}`)
  }
}
