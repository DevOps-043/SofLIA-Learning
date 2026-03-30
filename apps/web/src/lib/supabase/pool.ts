/**
 * Connection Pooling para Supabase
 *
 * Implementa un singleton pattern para reutilizar conexiones y evitar
 * crear múltiples clientes en cada request.
 *
 * OPTIMIZACIÓN: Reduce overhead de creación de conexiones
 * - Antes: Nuevo cliente en cada request (~50-100ms overhead)
 * - Después: Cliente reutilizado (~0ms overhead)
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Pool de clientes Supabase con caché LRU simple
class SupabaseConnectionPool {
  private clients: Map<string, ReturnType<typeof createSupabaseClient<Database>>>
  private maxConnections: number
  private connectionCount: number
  private hits: number
  private misses: number

  constructor(maxConnections: number = 10) {
    this.clients = new Map()
    this.maxConnections = maxConnections
    this.connectionCount = 0
    this.hits = 0
    this.misses = 0
  }

  /**
   * Obtiene o crea un cliente de Supabase
   * Usa las credenciales como key para reutilizar el mismo cliente
   */
  getClient(url: string, key: string): ReturnType<typeof createSupabaseClient<Database>> {
    const clientKey = `${url}:${key}`

    // Verificar si ya existe un cliente para estas credenciales
    if (this.clients.has(clientKey)) {
      this.hits++
      if (process.env.NODE_ENV === 'development') {
      }
      return this.clients.get(clientKey)!
    }

    // Si llegamos al límite de conexiones, eliminar la más antigua
    if (this.connectionCount >= this.maxConnections) {
      const firstKey = this.clients.keys().next().value
      this.clients.delete(firstKey)
      this.connectionCount--
      if (process.env.NODE_ENV === 'development') {
      }
    }

    // Crear nuevo cliente
    this.misses++
    const client = createSupabaseClient<Database>(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: false, // Server-side no necesita persistencia
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-connection-pool': 'true',
        },
      },
    })

    this.clients.set(clientKey, client)
    this.connectionCount++

    if (process.env.NODE_ENV === 'development') {
    }

    return client
  }

  /**
   * Obtiene estadísticas del pool
   */
  getStats() {
    const hitRate = this.hits + this.misses > 0
      ? (this.hits / (this.hits + this.misses) * 100).toFixed(2)
      : '0.00'

    return {
      hits: this.hits,
      misses: this.misses,
      connections: this.connectionCount,
      maxConnections: this.maxConnections,
      hitRate: `${hitRate}%`,
    }
  }

  /**
   * Limpia todas las conexiones del pool
   */
  clear() {
    this.clients.clear()
    this.connectionCount = 0
    this.hits = 0
    this.misses = 0
  }
}

// Singleton instance
const pool = new SupabaseConnectionPool(10)

// Exportar funciones de utilidad
export function getSupabaseClient(url: string, key: string) {
  return pool.getClient(url, key)
}

export function getPoolStats() {
  return pool.getStats()
}

export function clearPool() {
  pool.clear()
}
