/**
 * Servicio de caché básico para contexto de LIA
 * Usa Map nativo con TTL (Time To Live) para almacenar datos temporalmente
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class ContextCacheService {
  private static cache = new Map<string, CacheEntry<unknown>>();
  
  /**
   * Obtiene un valor del caché o lo carga usando el loader si no existe o expiró
   */
  static async get<T>(
    key: string,
    loader: () => Promise<T>,
    ttlMs: number = 5 * 60 * 1000 // 5 minutos por defecto
  ): Promise<T> {
    const entry = this.cache.get(key);
    const now = Date.now();
    
    // Si existe y no ha expirado, retornar valor cacheado
    if (entry && entry.expiresAt > now) {
      return entry.value as T;
    }
    
    // Si expiró o no existe, cargar nuevo valor
    const value = await loader();
    
    // Guardar en caché
    this.cache.set(key, {
      value,
      expiresAt: now + ttlMs,
    });
    
    return value;
  }
  
  /**
   * Guarda un valor en el caché con TTL específico
   */
  static set<T>(key: string, value: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }
  
  /**
   * Invalida una entrada específica del caché
   */
  static invalidate(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Invalida todas las entradas que empiezan con el prefijo dado
   * Útil para invalidar todo el contexto de un usuario: invalidatePrefix('user-123')
   */
  static invalidatePrefix(prefix: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }
  
  /**
   * Limpia todo el caché
   */
  static clear(): void {
    this.cache.clear();
  }
  
  /**
   * Limpia entradas expiradas (útil para mantenimiento periódico)
   */
  static cleanExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
  
  /**
   * Obtiene estadísticas del caché
   */
  static getStats() {
    const now = Date.now();
    let totalEntries = 0;
    let expiredEntries = 0;
    let activeEntries = 0;
    
    for (const entry of this.cache.values()) {
      totalEntries++;
      if (entry.expiresAt <= now) {
        expiredEntries++;
      } else {
        activeEntries++;
      }
    }
    
    return {
      totalEntries,
      activeEntries,
      expiredEntries,
    };
  }
}








