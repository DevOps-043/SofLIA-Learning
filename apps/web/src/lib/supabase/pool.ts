import {
  createClient as createSupabaseClient,
  type SupabaseClient as BaseSupabaseClient,
} from '@supabase/supabase-js'
import type { Database } from './types'

type SupabaseClient = BaseSupabaseClient<Database>

export interface SupabasePoolStats {
  hits: number
  misses: number
  connections: number
  maxConnections: number
  hitRate: string
}

export class SupabaseConnectionPool {
  private readonly clients = new Map<string, SupabaseClient>()
  private readonly maxConnections: number
  private hits = 0
  private misses = 0

  constructor(maxConnections: number = 10) {
    this.maxConnections = maxConnections
  }

  getClient(url: string, key: string): SupabaseClient {
    const clientKey = `${url}:${key}`
    const existingClient = this.clients.get(clientKey)

    if (existingClient) {
      this.hits++
      return existingClient
    }

    if (this.clients.size >= this.maxConnections) {
      const oldestClientKey = this.clients.keys().next().value as
        | string
        | undefined

      if (oldestClientKey) {
        this.clients.delete(oldestClientKey)
      }
    }

    this.misses++
    const client = createSupabaseClient<Database>(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
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
    return client
  }

  getStats(): SupabasePoolStats {
    const totalRequests = this.hits + this.misses
    const hitRate =
      totalRequests > 0 ? ((this.hits / totalRequests) * 100).toFixed(2) : '0.00'

    return {
      hits: this.hits,
      misses: this.misses,
      connections: this.clients.size,
      maxConnections: this.maxConnections,
      hitRate: `${hitRate}%`,
    }
  }

  clear() {
    this.clients.clear()
    this.hits = 0
    this.misses = 0
  }
}

export function createSupabaseConnectionPool(maxConnections: number = 10) {
  return new SupabaseConnectionPool(maxConnections)
}

const pool = createSupabaseConnectionPool(10)

export function getSupabaseClient(url: string, key: string) {
  return pool.getClient(url, key)
}

export function getPoolStats() {
  return pool.getStats()
}

export function clearPool() {
  pool.clear()
}
