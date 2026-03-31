/**
 * Utilidades seguras para prevenir ataques de Prototype Pollution
 *
 * @see https://owasp.org/www-community/attacks/Prototype_Pollution
 */

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
] as const;

/**
 * Verifica si una key es peligrosa para el prototipo
 */
export function isDangerousKey(key: string): boolean {
  return (DANGEROUS_KEYS as readonly string[]).includes(key);
}

/**
 * Filtra un objeto removiendo keys peligrosas
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): Partial<T> {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && !isDangerousKey(key)) {
      const value = obj[key];

      // Sanitizar recursivamente si es un objeto
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized as Partial<T>;
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
export function safeMerge<T extends Record<string, any>>(
  target: T,
  ...sources: Array<Record<string, any> | null | undefined>
): T {
  const result = { ...target };

  for (const source of sources) {
    if (!source || typeof source !== 'object') {
      continue;
    }

    const sanitizedSource = sanitizeObject(source);

    for (const key in sanitizedSource) {
      if (Object.prototype.hasOwnProperty.call(sanitizedSource, key)) {
        result[key as keyof T] = sanitizedSource[key] as any;
      }
    }
  }

  return result;
}

/**
 * Assign seguro que previene Prototype Pollution
 * Similar a Object.assign pero con validación de keys peligrosas
 *
 * @param target - Objeto destino
 * @param sources - Objetos fuente
 * @returns Objeto destino modificado
 */
export function safeAssign<T extends Record<string, any>>(
  target: T,
  ...sources: Array<Record<string, any> | null | undefined>
): T {
  for (const source of sources) {
    if (!source || typeof source !== 'object') {
      continue;
    }

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key) && !isDangerousKey(key)) {
        const value = source[key];

        // Sanitizar recursivamente si es un objeto
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          target[key as keyof T] = sanitizeObject(value) as any;
        } else {
          target[key as keyof T] = value;
        }
      }
    }
  }

  return target;
}

/**
 * Crea un objeto sin prototipo (más seguro para datos externos)
 *
 * @param obj - Objeto fuente
 * @returns Objeto sin prototipo con los mismos datos
 *
 * @example
 * const safe = createSafeObject({ name: 'John' });
 * console.log(safe.__proto__); // undefined
 */
export function createSafeObject<T extends Record<string, any>>(obj: T): T {
  const safe = Object.create(null);
  const sanitized = sanitizeObject(obj);

  for (const key in sanitized) {
    if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
      safe[key] = sanitized[key];
    }
  }

  return safe;
}

/**
 * Valida que un objeto no contenga keys peligrosas
 * Útil para validación de entrada antes de procesamiento
 *
 * @param obj - Objeto a validar
 * @returns true si el objeto es seguro, false si contiene keys peligrosas
 */
export function isObjectSafe(obj: Record<string, any>): boolean {
  if (!obj || typeof obj !== 'object') {
    return true;
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (isDangerousKey(key)) {
        return false;
      }

      // Validar recursivamente
      const value = obj[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (!isObjectSafe(value)) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Valida y lanza error si el objeto contiene keys peligrosas
 *
 * @param obj - Objeto a validar
 * @param context - Contexto para el mensaje de error (opcional)
 * @throws Error si el objeto contiene keys peligrosas
 */
export function validateObject(obj: Record<string, any>, context?: string): void {
  if (!isObjectSafe(obj)) {
    const contextMsg = context ? ` (${context})` : '';
    throw new Error(`Objeto contiene keys peligrosas que pueden causar Prototype Pollution${contextMsg}`);
  }
}
